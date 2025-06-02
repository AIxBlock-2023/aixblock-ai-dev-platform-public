
import { api } from './api';

export const aixblockApi = {
    getStoreData({ key, flowId, flowRunId }: { key: string; flowId: string; flowRunId: string }) {
        return api.get(`/v1/aixblock/provider/get-data/${flowId}`, {
            flowRunId,
            key,
        });
    },
};
