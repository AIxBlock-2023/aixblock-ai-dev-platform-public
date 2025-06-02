import { FastifyBaseLogger } from 'fastify';
import {
    AIxBlockError,
    AIxBlockTaskStatus,
    AIxBlockWaitSubmitFormKey,
    AIxBlockWaitSubmitMultimodalKey,
    apId,
    ErrorCode,
    FlowId,
    getScopeAndKey,
    isNil,
    PieceStoreScope,
    PopulatedFlow,
    StoreEntry,
    Trigger,
} from 'workflow-shared';
import { repoFactory } from '../../../core/db/repo-factory';
import { StoreEntryEntity } from '../../../store-entry/store-entry-entity';
import { flowVersionService } from '../../flow-version/flow-version.service';
import { flowRepo } from '../flow.repo';

const storeEntryRepo = repoFactory<StoreEntry>(StoreEntryEntity);

function findStep(obj: Trigger, step: string) {
    while (obj && obj.nextAction) {
        if (obj.nextAction.name === step) {
            return obj.nextAction;
        }
        obj = obj.nextAction;
    }
    return null;
}

export const aixblockTasksService = (log: FastifyBaseLogger) => ({
    getTasksByFlowIdOrThrow: async (flowId: string, stepName: string, flowRunId: string, useDraft: boolean) => {
        const { props } = await getPropsFromFlow(log, flowId, stepName, flowRunId, useDraft);

        const approveStoreKey = getScopeAndKey(PieceStoreScope.FLOW, AIxBlockWaitSubmitFormKey.APPROVE_LINK, flowId, flowRunId).key;

        const rejectStoreKey = getScopeAndKey(PieceStoreScope.FLOW, AIxBlockWaitSubmitFormKey.REJECT_LINK, flowId, flowRunId).key;
        const { approveLink, rejectLink } = await getApproveAndRejectLink(flowId, flowRunId, approveStoreKey, rejectStoreKey);

        const input = props?.settings.input;
        const rawDataSource = input.dataSource;
        return {
            dataSource: rawDataSource,
            approveLink: approveLink,
            rejectLink: rejectLink,
        };
    },
    submitDataSource: async (data: any, flowId: string, stepName: string, flowRunId: string, dataSourceId: string, useDraft: boolean) => {
        const { flow, props, storeKey } = await getPropsFromFlow(log, flowId, stepName, flowRunId, useDraft);
        const input = props?.settings.input;
        const rawDataSource = input.dataSource;
        const newDataSource = rawDataSource.map((item: any) => {
            if (item.id === dataSourceId) {
                const newProperties: any = {};
                for (const [fieldName, fieldData] of Object.entries(item.properties)) {
                    const value = data[fieldName];
                    newProperties[fieldName] = {
                        ...(fieldData as any),
                        value,
                    };
                }
                item.properties = newProperties;
            }
            return item;
        });
        await storeEntryRepo().upsert(
            {
                id: apId(),
                key: storeKey,
                value: newDataSource,
                projectId: flow.projectId,
            },
            ['projectId', 'key']
        );
        return {};
    },

    updateTaskStatus: async (data: any, flowId: string, stepName: string, flowRunId: string, dataSourceId: string, useDraft: boolean) => {
        const { flow, props, storeKey } = await getPropsFromFlow(log, flowId, stepName, flowRunId, useDraft);
        const input = props?.settings.input;
        const rawDataSource = input.dataSource;
        const newDataSource = rawDataSource.map((item: any) => {
            if (item.id === dataSourceId) {
                item.status = data.status ?? AIxBlockTaskStatus.TODO;
            }
            return item;
        });
        await storeEntryRepo().upsert(
            {
                id: apId(),
                key: storeKey,
                value: newDataSource,
                projectId: flow.projectId,
            },
            ['projectId', 'key']
        );
        return {};
    },

    updateTaskAssignee: async (data: any, flowId: string, stepName: string, flowRunId: string, dataSourceId: string, useDraft: boolean) => {
        const { flow, props, storeKey } = await getPropsFromFlow(log, flowId, stepName, flowRunId, useDraft);
        const input = props?.settings.input;
        const rawDataSource = input.dataSource;
        const newDataSource = rawDataSource.map((item: any) => {
            if (item.id === dataSourceId) {
                item.assignee = data.assignee ?? '';
            }
            return item;
        });
        await storeEntryRepo().upsert(
            {
                id: apId(),
                key: storeKey,
                value: newDataSource,
                projectId: flow.projectId,
            },
            ['projectId', 'key']
        );
        return {};
    },

    // Multimodal
    getMultimodalConfig: async (flowId: string, multimodalKey: string, flowRunId: string, useDraft: boolean) => {
        const { storeKeyRawDataSource, projectId } = await getMultimodalStoreKey(log, flowId, multimodalKey, flowRunId);
        const storeMultimodalConfig = await storeEntryRepo().findOne({
            where: {
                key: storeKeyRawDataSource,
                projectId,
            },
        });
        const rawDataSource = storeMultimodalConfig?.value;

        const approveStoreKey = getScopeAndKey(PieceStoreScope.FLOW, AIxBlockWaitSubmitMultimodalKey.APPROVE_LINK, flowId, flowRunId).key;
        const rejectStoreKey = getScopeAndKey(PieceStoreScope.FLOW, AIxBlockWaitSubmitMultimodalKey.REJECT_LINK, flowId, flowRunId).key;
        const { approveLink, rejectLink } = await getApproveAndRejectLink(flowId, flowRunId, approveStoreKey, rejectStoreKey);

        return {
            multimodalConfig: rawDataSource,
            approveLink,
            rejectLink,
        };
    },

    updateMultimodalConfig: async (data: any, flowId: string, multimodalKey: string, flowRunId: string, useDraft: boolean) => {
        const { storeKeyRawDataSource, projectId } = await getMultimodalStoreKey(log, flowId, multimodalKey, flowRunId);

        const resp = await storeEntryRepo().upsert(
            {
                id: apId(),
                key: storeKeyRawDataSource,
                value: data,
                projectId: projectId,
            },
            ['projectId', 'key']
        );

        return resp;
    },
});

async function getPropsFromFlow(log: FastifyBaseLogger, flowId: FlowId, stepName: string, flowRunId: string, useDraft: boolean) {
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
    const trigger = flow.version.trigger;
    const resp = findStep(trigger, stepName);
    const input = resp?.settings.input;

    const mappingKey = input.mappingKeyDataSource;
    const storeKeyRawDataSource = getScopeAndKey(PieceStoreScope.FLOW, mappingKey, flowId, flowRunId).key;
    const storeRawDataSource = await storeEntryRepo().findOne({
        where: {
            key: storeKeyRawDataSource,
        },
    });
    const rawDataSource = storeRawDataSource?.value;
    if (rawDataSource) {
        try {
            input.dataSource = rawDataSource as any[];
        } catch {
            input.dataSource = rawDataSource;
        }
    }

    return {
        flow,
        props: resp,
        projectId: flow.projectId,
        storeKey: storeKeyRawDataSource,
    };
}

async function getMultimodalStoreKey(log: FastifyBaseLogger, flowId: FlowId, multimodalKey: string, flowRunId: string) {
    const flow = await flowRepo().findOneBy({ id: flowId });
    if (isNil(flow)) {
        throw new AIxBlockError({
            code: ErrorCode.FLOW_FORM_NOT_FOUND,
            params: {
                flowId,
                message: 'Flow form not found in draft version of flow.',
            },
        });
    }

    const storeKeyRawDataSource = getScopeAndKey(PieceStoreScope.FLOW, multimodalKey, flowId, flowRunId).key;

    return {
        storeKeyRawDataSource,
        projectId: flow.projectId,
    };
}

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

export async function getApproveAndRejectLink(flowId: string, flowRunId: string, approveStoreKey: string, rejectStoreKey: string) {
    const promises = await Promise.all([
        storeEntryRepo().findOne({
            where: {
                key: approveStoreKey,
            },
        }),
        storeEntryRepo().findOne({
            where: {
                key: rejectStoreKey,
            },
        }),
    ]);

    const approveStore = promises[0];
    const rejectStore = promises[1];

    if (!approveStore || !rejectStore) {
        return {
            approveLink: '',
            rejectLink: '',
        }
    }

    return {
        approveLink: approveStore.value,
        rejectLink: rejectStore.value,
    };
}
