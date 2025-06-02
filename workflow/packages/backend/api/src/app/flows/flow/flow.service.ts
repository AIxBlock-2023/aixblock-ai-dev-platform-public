import { FastifyBaseLogger } from 'fastify'
import { FastifyRequest } from 'fastify/types/request'
import { EntityManager, In, IsNull } from 'typeorm'
import { AppSystemProp, rejectedPromiseHandler, WorkerSystemProp } from 'workflow-server-shared'
import {
    AIxBlockError,
    apId,
    CreateFlowRequest,
    Cursor,
    ErrorCode,
    Flow,
    FlowGpu,
    FlowId,
    FlowOperationRequest,
    FlowOperationType,
    flowPieceUtil,
    FlowStatus,
    FlowTemplateWithoutProjectInformation,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    isNil,
    ListingCategory,
    OffsetPaginationParams,
    PlatformId,
    PopulatedFlow,
    ProjectId,
    SeekPage,
    UserId
} from 'workflow-shared'
import { userIdentityRepository } from '../../authentication/user-identity/user-identity-service'
import { transaction } from '../../core/db/transaction'
import { emailService } from '../../ee/helper/email/email-service'
import { distributedLock } from '../../helper/lock'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { userService } from '../../user/user-service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { flowFolderService } from '../folder/folder.service'
import { ListingCategoryEntity } from '../listing/listing-category.entity'
import { listingCategoryRepo } from '../listing/listing-category.repo'
import { aixblockService } from './aixblock/aixblock.service'
import { flowSideEffects } from './flow-service-side-effects'
import { FlowEntity, FlowSchema } from './flow.entity'
import { flowRepo } from './flow.repo'
import { buildOffsetPaginator } from '../../helper/pagination/build-offset-paginator'


const TRIGGER_FAILURES_THRESHOLD = system.getNumberOrThrow(AppSystemProp.TRIGGER_FAILURES_THRESHOLD)

const getFolderIdFromRequest = async ({ projectId, folderId, folderName, log }: { projectId: string, folderId: string | undefined, folderName: string | undefined, log: FastifyBaseLogger }) => {
    if (folderId) {
        return folderId
    }
    if (folderName) {
        return (await flowFolderService(log).upsert({
            projectId,
            request: {
                projectId,
                displayName: folderName,
            },
        })).id
    }
    return null
}

export const flowService = (log: FastifyBaseLogger) => ({
    async create({ projectId, request, externalId }: CreateParams): Promise<PopulatedFlow> {

        const folderId = await getFolderIdFromRequest({ projectId, folderId: request.folderId, folderName: request.folderName, log })
        const newFlow: NewFlow = {
            id: apId(),
            projectId,
            folderId,
            status: FlowStatus.DISABLED,
            publishedVersionId: null,
            schedule: null,
            externalId,
            metadata: request.metadata,
        }
        const savedFlow = await flowRepo().save(newFlow)

        const savedFlowVersion = await flowVersionService(log).createEmptyVersion(
            savedFlow.id,
            {
                displayName: request.displayName,
            },
        )

        return {
            ...savedFlow,
            version: savedFlowVersion,
        }
    },

    async list({
        projectId,
        cursorRequest,
        limit,
        folderId,
        status,
        name,
        versionState = FlowVersionState.DRAFT,
    }: ListParams): Promise<SeekPage<PopulatedFlow>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)

        const paginator = buildPaginator({
            entity: FlowEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryWhere: Record<string, unknown> = { projectId }

        if (folderId !== undefined) {
            queryWhere.folderId = folderId === 'NULL' ? IsNull() : folderId
        }

        if (status !== undefined) {
            queryWhere.status = In(status)
        }
        const paginationResult = await paginator.paginate(
            flowRepo().createQueryBuilder('flow').where(queryWhere),
        )


        const populatedFlowPromises = paginationResult.data.map(async (flow) => {
            const version = await flowVersionService(log).getFlowVersionOrThrow({
                flowId: flow.id,
                versionId: (versionState === FlowVersionState.DRAFT) ? undefined : (flow.publishedVersionId ?? undefined),
            })

            return {
                ...flow,
                version,
            }
        })

        const populatedFlows = (await Promise.all(populatedFlowPromises))
        const filteredPopulatedFlows = name ? populatedFlows.filter((flow) => flow.version.displayName.match(new RegExp(`^.*${name}.*`, 'i'))) : populatedFlows
        return paginationHelper.createPage(filteredPopulatedFlows, paginationResult.cursor)
    },

    async getOneById(id: string): Promise<Flow | null> {
        return flowRepo().findOneBy({
            id,
        })
    },
    async getOne({ id, projectId, entityManager }: GetOneParams): Promise<Flow | null> {
        return flowRepo(entityManager).findOneBy({
            id,
            projectId,
        })
    },

    async getOneOrThrow(params: GetOneParams): Promise<Flow> {
        const flow = await this.getOne(params)
        assertFlowIsNotNull(flow)
        return flow
    },

    async getOnePopulated({
        id,
        projectId,
        versionId,
        removeConnectionsName = false,
        removeSampleData = false,
        entityManager,
    }: GetOnePopulatedParams): Promise<PopulatedFlow | null> {
        const flow = await flowRepo(entityManager).findOneBy({
            id,
            projectId,
        })

        if (isNil(flow)) {
            return null
        }

        const flowVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: id,
            versionId,
            removeConnectionsName,
            removeSampleData,
            entityManager,
        })

        return {
            ...flow,
            version: flowVersion,
        }
    },

    async getOnePopulatedOrThrow({
        id,
        projectId,
        versionId,
        removeConnectionsName = false,
        removeSampleData = false,
        entityManager,
    }: GetOnePopulatedParams): Promise<PopulatedFlow> {
        const flow = await this.getOnePopulated({
            id,
            projectId,
            versionId,
            removeConnectionsName,
            removeSampleData,
            entityManager,
        })
        assertFlowIsNotNull(flow)
        return flow
    },

    async update({
        id,
        userId,
        projectId,
        platformId,
        operation,
        lock = true,
    }: UpdateParams): Promise<PopulatedFlow> {
        const flowLock = lock
            ? await distributedLock.acquireLock({
                key: id,
                timeout: 30000,
                log,
            })
            : null

        try {
            switch (operation.type) {
                case FlowOperationType.LOCK_AND_PUBLISH:
                    {
                        await this.updatedPublishedVersionId({
                            id,
                            userId,
                            projectId,
                            platformId,
                        })
                        break
                    }

                case FlowOperationType.CHANGE_STATUS:
                    {
                        await this.updateStatus({
                            id,
                            projectId,
                            newStatus: operation.request.status,
                        })
                        break
                    }

                case FlowOperationType.CHANGE_FOLDER:
                    {
                        await flowRepo().update(id, {
                            folderId: operation.request.folderId,
                        })
                        break
                    }

                default: {
                    let lastVersion = await flowVersionService(log).getFlowVersionOrThrow({
                        flowId: id,
                        versionId: undefined,
                    })

                    if (lastVersion.state === FlowVersionState.LOCKED) {
                        const lastVersionWithArtifacts =
                            await flowVersionService(log).getFlowVersionOrThrow({
                                flowId: id,
                                versionId: undefined,
                            })

                        lastVersion = await flowVersionService(log).createEmptyVersion(id, {
                            displayName: lastVersionWithArtifacts.displayName,
                        })

                        // Duplicate the artifacts from the previous version, otherwise they will be deleted during update operation
                        lastVersion = await flowVersionService(log).applyOperation({
                            userId,
                            projectId,
                            platformId,
                            flowVersion: lastVersion,
                            userOperation: {
                                type: FlowOperationType.IMPORT_FLOW,
                                request: lastVersionWithArtifacts,
                            },
                        })
                    }
                    await flowVersionService(log).applyOperation({
                        userId,
                        projectId,
                        platformId,
                        flowVersion: lastVersion,
                        userOperation: operation,
                    })
                }
            }
        }
        finally {
            await flowLock?.release()
        }

        return this.getOnePopulatedOrThrow({
            id,
            projectId,
        })
    },

    async updateStatus({
        id,
        projectId,
        newStatus,
        entityManager,
    }: UpdateStatusParams): Promise<PopulatedFlow> {
        const flowToUpdate = await this.getOneOrThrow({
            id,
            projectId,
            entityManager,
        })

        if (flowToUpdate.status !== newStatus) {
            const { scheduleOptions } = await flowSideEffects(log).preUpdateStatus({
                flowToUpdate,
                newStatus,
                entityManager,
            })

            flowToUpdate.status = newStatus
            flowToUpdate.schedule = scheduleOptions

            await flowRepo(entityManager).save(flowToUpdate)
        }

        return this.getOnePopulatedOrThrow({
            id,
            projectId,
            entityManager,
        })
    },

    async updateFailureCount({
        flowId,
        projectId,
        success,
    }: UpdateFailureCountParams): Promise<void> {
        const flow = await this.getOnePopulatedOrThrow({
            id: flowId,
            projectId,
        })

        const { schedule } = flow
        const skipUpdateFlowCount = isNil(schedule) || flow.status === FlowStatus.DISABLED

        if (skipUpdateFlowCount) {
            return
        }
        const newFailureCount = success ? 0 : (schedule.failureCount ?? 0) + 1

        if (newFailureCount >= TRIGGER_FAILURES_THRESHOLD) {
            await this.updateStatus({
                id: flowId,
                projectId,
                newStatus: FlowStatus.DISABLED,
            })

            await emailService(log).sendExceedFailureThresholdAlert(projectId, flow.version.displayName)
        }

        await flowRepo().update(flowId, {
            schedule: {
                ...flow.schedule,
                failureCount: newFailureCount,
            },
        })
    },


    async updatedPublishedVersionId({
        id,
        userId,
        projectId,
        platformId,
    }: UpdatePublishedVersionIdParams): Promise<PopulatedFlow> {
        const flowToUpdate = await this.getOneOrThrow({ id, projectId })

        const flowVersionToPublish = await flowVersionService(log).getFlowVersionOrThrow(
            {
                flowId: id,
                versionId: undefined,
            },
        )

        const { scheduleOptions } = await flowSideEffects(log).preUpdatePublishedVersionId({
            flowToUpdate,
            flowVersionToPublish,
        })

        return transaction(async (entityManager) => {
            const lockedFlowVersion = await lockFlowVersionIfNotLocked({
                flowVersion: flowVersionToPublish,
                userId,
                projectId,
                platformId,
                entityManager,
                log,
            })

            flowToUpdate.publishedVersionId = lockedFlowVersion.id
            flowToUpdate.status = FlowStatus.ENABLED
            flowToUpdate.schedule = scheduleOptions

            const updatedFlow = await flowRepo(entityManager).save(flowToUpdate)

            return {
                ...updatedFlow,
                version: lockedFlowVersion,
            }
        })
    },

    async delete({ id, projectId }: DeleteParams): Promise<void> {
        const lock = await distributedLock.acquireLock({
            key: id,
            timeout: 10000,
            log,
        })

        try {
            const flowToDelete = await this.getOneOrThrow({
                id,
                projectId,
            })

            rejectedPromiseHandler(flowSideEffects(log).preDelete({
                flowToDelete,
            }), log)

            await flowRepo().delete({ id })
        }
        finally {
            await lock.release()
        }
    },

    async getAllEnabled(): Promise<Flow[]> {
        return flowRepo().findBy({
            status: FlowStatus.ENABLED,
        })
    },

    async getTemplate({
        flowId,
        versionId,
        projectId,
    }: GetTemplateParams): Promise<FlowTemplateWithoutProjectInformation> {
        const flow = await this.getOnePopulatedOrThrow({
            id: flowId,
            projectId,
            versionId,
            removeConnectionsName: true,
            removeSampleData: true,
        })

        return {
            name: flow.version.displayName,
            description: '',
            blocks: Array.from(new Set(flowPieceUtil.getUsedBlocks(flow.version.trigger))),
            template: flow.version,
            tags: [],
            created: Date.now().toString(),
            updated: Date.now().toString(),
            blogUrl: '',
        }
    },

    async count({ projectId, folderId, status }: CountParams): Promise<number> {
        if (folderId === undefined) {
            return flowRepo().countBy({ projectId, status })
        }

        return flowRepo().countBy({
            folderId: folderId !== 'NULL' ? folderId : IsNull(),
            projectId,
            status,
        })
    },

    async existsByProjectAndStatus(params: ExistsByProjectAndStatusParams): Promise<boolean> {
        const { projectId, status, entityManager } = params

        return flowRepo(entityManager).existsBy({
            projectId,
            status,
        })
    },

    async updateListingStatus(params: ListingParams): Promise<PopulatedFlow> {
        const { id, projectId, ...body } = params
        const flowToUpdate = await this.getOneOrThrow({ id, projectId })
        const updatedFlow = await flowRepo().save({
            ...flowToUpdate,
            ...body,
        })
        let lastVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: id,
            versionId: undefined,
        })
        return {
            ...updatedFlow,
            version: lastVersion,
        }
    },
    async listListingCategory({
        cursorRequest,
        limit,
    }: ListListingCategoryParams): Promise<SeekPage<ListingCategory>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)

        const paginator = buildPaginator({
            entity: ListingCategoryEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const paginationResult = await paginator.paginate(
            listingCategoryRepo().createQueryBuilder('listing_category'),
        )
        return paginationHelper.createPage(paginationResult.data, paginationResult.cursor)
    },

    /**
     * Generates the public URL for the preview image of a given flow.
     *
     * @param flow - The flow object containing metadata used to generate the preview image URL.
     * @returns A string representing the public URL to the flow's preview image, or null if not available.
     */
    getPreviewFlowPublicUrl(flow: FlowSchema): string | null {
        if (flow.listingPreview)
            return `${system.getOrThrow(WorkerSystemProp.FRONTEND_URL)}/projects/${flow.projectId}/flows/${flow.id}/preview`
        return null
    },

    async listFlowGpu(request: FastifyRequest): Promise<FlowGpu[]> {
        const userId = request.principal.id
        const user = await userService.getOneOrFail({ id: userId })
        const identity = await userIdentityRepository().findOneByOrFail({ id: user.identityId })
        let listGpu: FlowGpu[] = []
        if (identity && identity.url && identity.token) {
            listGpu = await aixblockService(log).getComputeMarketGpus(identity.url, identity.token)
        }
        return listGpu
    },

    v2: {
        async list({
            projectId,
            limit,
            page,
            folderId,
            status,
            name,
            versionState = FlowVersionState.DRAFT,
        }: ListParams): Promise<SeekPage<PopulatedFlow>> {
            const paginator = buildOffsetPaginator({
                entity: FlowEntity,
                query: {
                    limit,
                    page,
                    order: 'DESC',
                },
            })

            const queryWhere: Record<string, unknown> = { projectId }

            if (folderId !== undefined) {
                queryWhere.folderId = folderId === 'NULL' ? IsNull() : folderId
            }

            if (status !== undefined) {
                queryWhere.status = In(status)
            }
            const builder = flowRepo()
                .createQueryBuilder('flow')
                .where(queryWhere)

            if (versionState === FlowVersionState.DRAFT) {
                builder.leftJoinAndSelect(
                    'flow_version',
                    'version',
                    'version.flowId = flow.id AND version.state = :versionState',
                    { versionState: FlowVersionState.DRAFT },
                )
            }
            else {
                builder.leftJoinAndSelect(
                    'flow_version',
                    'version',
                    'version.id = flow.publishedVersionId',
                )
            }
            if (name) {
                builder.andWhere('version.displayName ILIKE :name', { name: `%${name}%` }) // PostgreSQL
            }
            const paginationResult = await paginator.paginate(builder)

            const populatedFlowPromises = paginationResult.data.map(async (flow) => {
                const version = await flowVersionService(log).getFlowVersionOrThrow({
                    flowId: flow.id,
                    versionId: (versionState === FlowVersionState.DRAFT) ? undefined : (flow.publishedVersionId ?? undefined),
                })

                return {
                    ...flow,
                    version,
                }
            })
            const populatedFlows = (await Promise.all(populatedFlowPromises))
            return paginationHelper.createPageOffet(populatedFlows, paginationResult.pageCount)
        },
    }

})

const lockFlowVersionIfNotLocked = async ({
    flowVersion,
    userId,
    projectId,
    platformId,
    entityManager,
    log,
}: LockFlowVersionIfNotLockedParams): Promise<FlowVersion> => {
    if (flowVersion.state === FlowVersionState.LOCKED) {
        return flowVersion
    }

    return flowVersionService(log).applyOperation({
        userId,
        projectId,
        platformId,
        flowVersion,
        userOperation: {
            type: FlowOperationType.LOCK_FLOW,
            request: {
                flowId: flowVersion.flowId,
            },
        },
        entityManager,
    })
}

const assertFlowIsNotNull: <T extends Flow>(
    flow: T | null
) => asserts flow is T = <T>(flow: T | null) => {
    if (isNil(flow)) {
        throw new AIxBlockError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {},
        })
    }
}

type CreateParams = {
    projectId: ProjectId
    request: CreateFlowRequest
    externalId?: string
}

type ListParams = {
    projectId: ProjectId
    cursorRequest: Cursor | null
    folderId: string | undefined
    status: FlowStatus[] | undefined
    name: string | undefined
    versionState?: FlowVersionState
} & OffsetPaginationParams

type GetOneParams = {
    id: FlowId
    projectId: ProjectId
    entityManager?: EntityManager
}

type GetOnePopulatedParams = GetOneParams & {
    versionId?: FlowVersionId
    removeConnectionsName?: boolean
    removeSampleData?: boolean
}

type GetTemplateParams = {
    flowId: FlowId
    projectId: ProjectId
    versionId: FlowVersionId | undefined
}

type CountParams = {
    projectId: ProjectId
    folderId?: string
    status?: FlowStatus
}

type UpdateParams = {
    id: FlowId
    userId: UserId | null
    projectId: ProjectId
    operation: FlowOperationRequest
    lock?: boolean
    platformId: PlatformId
}

type UpdateStatusParams = {
    id: FlowId
    projectId: ProjectId
    newStatus: FlowStatus
    entityManager?: EntityManager
}

type UpdateFailureCountParams = {
    flowId: FlowId
    projectId: ProjectId
    success: boolean
}

type UpdatePublishedVersionIdParams = {
    id: FlowId
    userId: UserId | null
    platformId: PlatformId
    projectId: ProjectId
}

type DeleteParams = {
    id: FlowId
    projectId: ProjectId
}

type NewFlow = Omit<Flow, 'created' | 'updated'>

type LockFlowVersionIfNotLockedParams = {
    flowVersion: FlowVersion
    userId: UserId | null
    projectId: ProjectId
    platformId: PlatformId
    entityManager: EntityManager
    log: FastifyBaseLogger
}

type ExistsByProjectAndStatusParams = {
    projectId: ProjectId
    status: FlowStatus
    entityManager: EntityManager
}

type ListingParams = {
    id: FlowId
    projectId: ProjectId
    listingName?: string | null
    listingPrice?: number | null
    listingStatus?: boolean | null
    listingDescription?: string | null
    listingPreview?: string | null
    listingUserId?: number | null
    listingCategoryId?: string | null
}

type ListListingCategoryParams = {
    cursorRequest: Cursor | null
    limit: number
}
