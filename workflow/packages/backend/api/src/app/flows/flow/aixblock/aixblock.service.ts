import AIxBlock from '@tonyshark/aixblock-sdk/lib';
import { FastifyBaseLogger, FastifyRequest } from 'fastify';
import { apVersionUtil } from 'workflow-server-shared';
import { ApEdition, apId, EnginePrincipal, FlowGpu, getScopeAndKey, ImportTemplateType, isNil, PieceStoreScope, StoreEntry } from 'workflow-shared';
import { aiProviderService } from '../../../ai/ai-provider.service';
import { userIdentityRepository } from '../../../authentication/user-identity/user-identity-service';
import { blockMetadataService } from '../../../blocks/block-metadata-service';
import { repoFactory } from '../../../core/db/repo-factory';
import { projectService } from '../../../project/project-service';
import { StoreEntryEntity } from '../../../store-entry/store-entry-entity';
import { userService } from '../../../user/user-service';

const storeEntryRepo = repoFactory<StoreEntry>(StoreEntryEntity);
const providerKey = 'aixblock-provider';

export const aixblockService = (log: FastifyBaseLogger) => ({
    getAIxBlockProviderModel: async (request: FastifyRequest) => {
        const { projectId } = request.principal as EnginePrincipal;
        const query: any = request.query;
        const modelType = query.modelType;
        console.log('request.principal aixblock service', request.principal);

        const platformId = await projectService.getPlatformId(projectId);
        const resp = await aiProviderService.getOrThrow({
            platformId: platformId,
            provider: 'aixblock',
            projectId,
        });

        const baseUrl = resp.baseUrl;
        const defaultAuthorization = resp.config.defaultHeaders.Authorization.split(' ');
        const token = defaultAuthorization[defaultAuthorization.length - 1];

        const aixblockSdk = new AIxBlock({
            baseApi: baseUrl,
            apiKey: token,
        });

        const supportedModels = await aixblockSdk.getSupportedModels({
            modelType: modelType,
        });

        return supportedModels;
    },

    getAIxBlockProviderInfo: async (request: FastifyRequest) => {
        const { projectId } = request.principal as EnginePrincipal;

        const platformId = await projectService.getPlatformId(projectId);
        const resp = await aiProviderService.getOrThrow({
            platformId: platformId,
            provider: 'aixblock',
            projectId,
        });

        const baseUrl = resp.baseUrl;
        const defaultAuthorization = resp.config.defaultHeaders.Authorization.split(' ');
        const token = defaultAuthorization[defaultAuthorization.length - 1];

        return {
            baseUrl,
            token,
        };
    },

    upsertData: async (request: FastifyRequest) => {
        const body: any = request.body;
        const query: any = request.query;
        const params: any = request.params;
        const flowId = params.flowId;
        const flowRunId = query.flowRunId || '';
        const projectId = request.principal.projectId;
        const key = query.key ? query.key : getScopeAndKey(PieceStoreScope.FLOW, providerKey, flowId, flowRunId).key;
        await storeEntryRepo().upsert(
            {
                id: apId(),
                key: key,
                value: body,
                projectId,
            },
            ['projectId', 'key']
        );
        return {
            key,
        };
    },

    getData: async (request: FastifyRequest) => {
        const params: any = request.params;
        const query: any = request.query;
        const flowId = params.flowId;
        const flowRunId = query.flowRunId || '';
        const projectId = request.principal.projectId;
        const key = query.key ? query.key : getScopeAndKey(PieceStoreScope.FLOW, providerKey, flowId, flowRunId).key;
        const storeRawDataSource = await storeEntryRepo().findOne({
            where: {
                key: key,
                projectId,
            },
        });
        return storeRawDataSource?.value || {};
    },

    mappingPiecesMetadata: async (request: FastifyRequest) => {
        const params: any = request.query;
        const type = params.type;
        const latestRelease = await apVersionUtil.getCurrentRelease();
        const pieceMetadata = await blockMetadataService(log).list({
            release: latestRelease,
            includeHidden: true,
            edition: ApEdition.COMMUNITY,
            includeTags: true,
            getAllBlocks: true
        });
        
        if (type === ImportTemplateType.ZAPIER) {
            return pieceMetadata;
        }

        const data: any = {};
        for (const piece of pieceMetadata) {
            const rawActions = piece.rawActions;
            const rawTriggers = piece.rawTriggers;
            if (!isNil(rawActions)) {
                const blockName = piece.name.replace('@activepieces/piece-', '');
    
                for (const [key, value] of Object.entries(rawActions)) {
                    const objPiece = {
                        activepiecesModule: piece.name,
                        actionName: value.name,
                        activepiecesAction: key,
                        pieceVersion: piece.version,
                        paramsMapping: value.props,
                        type: 'action',
                        blockType: piece.blockType,
                        packageType: piece.packageType,
                    };
                    data[`${blockName}:${key}`] = objPiece;
                }
            }
            if (!isNil(rawTriggers)) {
                const blockName = piece.name.replace('@activepieces/piece-', '');
    
                for (const [key, value] of Object.entries(rawTriggers)) {
                    const objPiece = {
                        activepiecesModule: piece.name,
                        actionName: value.name,
                        activepiecesAction: key,
                        pieceVersion: piece.version,
                        paramsMapping: value.props,
                        type: 'trigger',
                        blockType: piece.blockType,
                        packageType: piece.packageType,
                    };
                    data[`${blockName}:${key}`] = objPiece;
                }

            }
        }
        return data;
    },

    getAIxBlockAPIKey: async (request: FastifyRequest) => {
        const principal = request.principal;
        const userId = request.principal.id;
        const user = await userService.getOneOrFail({ id: userId });
        const identity = await userIdentityRepository().findOneByOrFail({ id: user.identityId });
        console.log(principal)
    },
    /**
     * Get list user compute gpus in platforms
     * @param baseUrl Platform base url
     * @param token Token
     */
    getComputeMarketGpus: async (baseUrl: string, token: string): Promise<FlowGpu[]> => {
        const aixblockSdk = new AIxBlock({
            baseApi: baseUrl,
            apiKey: token,
        })
        const result = await aixblockSdk.getGpus('0')
        return result?.data
    },
});
