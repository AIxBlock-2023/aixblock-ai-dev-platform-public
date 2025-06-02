import { FastifyBaseLogger } from 'fastify';
import {
    AIxBlockError,
    AIxBlockWebFormInputType,
    AIxBlockWebFormWaitSubmit,
    apId,
    ChatUIResponse,
    ErrorCode,
    FlowId,
    FormResponse,
    getScopeAndKey,
    isNil,
    PieceStoreScope,
    PopulatedFlow,
    StoreEntry,
    Trigger,
} from 'workflow-shared';
import { blockMetadataService } from '../../../blocks/block-metadata-service';
import { repoFactory } from '../../../core/db/repo-factory';
import { platformService } from '../../../platform/platform.service';
import { projectService } from '../../../project/project-service';
import { StoreEntryEntity } from '../../../store-entry/store-entry-entity';
import { flowVersionService } from '../../flow-version/flow-version.service';
import { getApproveAndRejectLink } from '../aixblock-tasks/aixblock-tasks.service';
import { flowRepo } from '../flow.repo';

const FORMS_PIECE_NAME = 'workflow-aixblock';
const FORM_TRIIGGER = 'form_submission';
const FILE_TRIGGER = 'file_submission';
const SIMPLE_FILE_PROPS = {
    inputs: [
        {
            displayName: 'File',
            description: '',
            type: AIxBlockWebFormInputType.FILE,
            required: true,
        },
    ],
    waitForResponse: true,
};
const FORMS_TRIGGER_NAMES = [FORM_TRIIGGER, FILE_TRIGGER];

const storeEntryRepo = repoFactory<StoreEntry>(StoreEntryEntity);

function isFormTrigger(flow: PopulatedFlow | null): flow is PopulatedFlow {
    if (isNil(flow)) {
        return false;
    }
    const triggerSettings = flow.version.trigger.settings;
    return triggerSettings.blockName === FORMS_PIECE_NAME && FORMS_TRIGGER_NAMES.includes(triggerSettings.triggerName);
}

function findStep(obj: Trigger, step: string) {
    while (obj && obj.nextAction) {
        if (obj.nextAction.name === step) {
            return obj.nextAction;
        }
        obj = obj.nextAction;
    }
    return null;
}

function getFormStoreKey(projectId: string, flowId: string, stepName: string, flowRunId: string) {
    const key = `project:${projectId}/flowId:${flowId}/flowRunId:${flowRunId}/stepName:${stepName}`;
    return key;
}

export const aixblockWebFormsService = (log: FastifyBaseLogger) => ({
    getFormByFlowIdOrThrow: async (flowId: string, useDraft: boolean): Promise<FormResponse> => {
        const flow = await getPopulatedFlowById(log, flowId, useDraft);
        if (!isFormTrigger(flow)) {
            throw new AIxBlockError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Flow form not found in draft version of flow.',
                },
            });
        }
        const pieceVersion = await blockMetadataService(log).getExactBlockVersion({
            name: FORMS_PIECE_NAME,
            version: flow.version.trigger.settings.pieceVersion,
            projectId: flow.projectId,
            platformId: await projectService.getPlatformId(flow.projectId),
        });
        const triggerSettings = flow.version.trigger.settings;
        return {
            id: flow.id,
            title: flow.version.displayName,
            props: triggerSettings.triggerName === FILE_TRIGGER ? SIMPLE_FILE_PROPS : triggerSettings.input,
            projectId: flow.projectId,
            version: pieceVersion,
        };
    },
    getFormActionByFlowIdOrThrow: async (flowId: string, stepName: string, flowRunId: string, useDraft: boolean) => {
        const flow = await getPopulatedFlowById(log, flowId, useDraft);
        if (isNil(flow)) {
            throw new AIxBlockError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Flow form not found in draft version of flow.',
                },
            });
        }

        const approveStoreKey = getScopeAndKey(PieceStoreScope.FLOW, AIxBlockWebFormWaitSubmit.APPROVE_LINK, flowId, flowRunId).key;

        const rejectStoreKey = getScopeAndKey(PieceStoreScope.FLOW, AIxBlockWebFormWaitSubmit.REJECT_LINK, flowId, flowRunId).key;

        const { approveLink, rejectLink } = await getApproveAndRejectLink(flowId, flowRunId, approveStoreKey, rejectStoreKey);

        if (!approveLink || !rejectLink) {
            throw new AIxBlockError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Approve link not found for this flow.',
                },
            });
        }

        const trigger = flow.version.trigger;
        const resp = findStep(trigger, stepName);
        const props = resp?.settings.input;
        for (const input of props.inputs) {
            if (input.type === AIxBlockWebFormInputType.RADIO || input.type === AIxBlockWebFormInputType.DROPDOWN) {
                const inputFlow = await getPopulatedFlowById(log, flowId, useDraft);
                if (!inputFlow) {
                    continue;
                }
                const trigger = inputFlow.version.trigger;
                const stepName = input.dataSource.replace(/{{(.*?)}}/, '$1');
                const res = findStep(trigger, stepName);
                if (!res) {
                    continue;
                }

                const settings = res.settings.input;
                const storeKey = settings.key;
                const storeScope = PieceStoreScope.FLOW;
                const key = getScopeAndKey(storeScope, storeKey, flowId, flowRunId).key;
                const storeEntry = await storeEntryRepo().findOneBy({
                    key,
                });
                if (!storeEntry) {
                    continue;
                }
                try {
                    input.dataSource = JSON.parse(storeEntry.value as string);
                } catch {
                    input.dataSource = storeEntry.value;
                }
            }
        }
        return {
            id: flow.id,
            title: flow.version.displayName,
            props: props,
            projectId: flow.projectId,
            version: '0.0.1',
            approveLink,
            rejectLink,
        };
    },
    submitFormToStore: async (request: any) => {
        const flowId = request.params.flowId;
        const stepName = request.query.stepName;
        const useDraft = request.query.useDraft ?? false;
        const flowRunId = request.query.flowRunId ?? '';
        const body = request.body;
        const flow = await getPopulatedFlowById(log, flowId, useDraft);
        if (isNil(flow)) {
            throw new AIxBlockError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Flow form not found in draft version of flow.',
                },
            });
        }
        const projectId = flow.projectId;
        const key = getFormStoreKey(projectId, flow.id, stepName, flowRunId);
        await storeEntryRepo().upsert(
            {
                id: apId(),
                key: key,
                value: JSON.stringify(body),
                projectId,
            },
            ['projectId', 'key']
        );
        return {
            key,
        };
    },
    getFormDataFromStoreByFlowId: async (request: any) => {
        const flowId = request.params.flowId;
        const stepName = request.query.stepName;
        const projectId = request.query.projectId;
        const flowRunId = request.query.flowRunId ?? '';
        const flow = await flowRepo().findOneBy({ id: flowId });
        if (isNil(flow)) {
            return {
                success: false,
                key: '',
            };
        }
        const key = getFormStoreKey(projectId, flowId, stepName, flowRunId);
        const storeEntry = await storeEntryRepo().findOneBy({
            key,
        });
        if (isNil(storeEntry)) {
            return {
                success: true,
                key: key,
            };
        }
        return {
            success: true,
            key: key,
            value: JSON.parse(storeEntry.value as string),
        };
    },
    deleteDataFromStoreByFlowId: async (request: any) => {
        const flowId = request.params.flowId;
        const stepName = request.query.stepName;
        const projectId = request.query.projectId;
        const flowRunId = request.query.flowRunId ?? '';
        const flow = await flowRepo().findOneBy({ id: flowId });
        if (isNil(flow)) {
            return {
                success: false,
                key: '',
            };
        }
        const key = getFormStoreKey(projectId, flowId, stepName, flowRunId);
        await storeEntryRepo().delete({
            projectId,
            key,
        });
        return {
            success: true,
        };
    },
    getChatUIByFlowIdOrThrow: async (flowId: string, useDraft: boolean): Promise<ChatUIResponse> => {
        const flow = await getPopulatedFlowById(log, flowId, useDraft);
        if (
            !flow ||
            flow.version.trigger.settings.triggerName !== 'chat_submission' ||
            flow.version.trigger.settings.blockName !== FORMS_PIECE_NAME
        ) {
            throw new AIxBlockError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Flow chat ui not found in draft version of flow.',
                },
            });
        }
        const platformId = await projectService.getPlatformId(flow.projectId);
        const platform = await platformService.getOneOrThrow(platformId);
        return {
            id: flow.id,
            title: flow.version.displayName,
            props: flow.version.trigger.settings.input,
            projectId: flow.projectId,
            platformLogoUrl: platform.logoIconUrl,
            platformName: platform.name,
        };
    },
});

async function getPopulatedFlowById(log: FastifyBaseLogger, id: FlowId, useDraft: boolean): Promise<PopulatedFlow | null> {
    const flow = await flowRepo().findOneBy({ id });
    if (isNil(flow) || (isNil(flow.publishedVersionId) && !useDraft)) {
        return null;
    }
    const flowVersion = await flowVersionService(log).getFlowVersionOrThrow({
        flowId: id,
        versionId: useDraft ? undefined : flow.publishedVersionId!,
    });
    return {
        ...flow,
        version: flowVersion,
    };
}
