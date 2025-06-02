import { httpClient, HttpMethod } from "workflow-blocks-common";
import { createAction, Property } from "workflow-blocks-framework";
import { aixblockAuth } from '../../..';

interface TensorboardResponse {
    dashboard_url: string;
    proxy_url: string;
    tensorboard_url: string;
}

export const getTensorboard = createAction({
    name: 'get_tensorboard',
    displayName: 'Get Tensorboard',
    description: 'Get Tensorboard URL for a specific project and backend',
    auth: aixblockAuth,
    props: {
        ml_id: Property.ShortText({
            displayName: 'Installed Model ID',
            description: 'Identifier of the ML model installed on the currently active compute environment, used for training or prediction',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        if (!propsValue.ml_id) {
            throw new Error('ML ID is required');
        }

        const resp = await getDashboard(propsValue.ml_id, auth.baseApiUrl, auth.apiToken);
        return resp;

    }
});

export const getDashboard = async (ml_id: string, baseApiUrl: string, apiToken: string) => {
    // Fetch ML Info to get project
    const mlResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseApiUrl}/api/ml/${ml_id}`,
        headers: {
            Authorization: `Token ${apiToken}`
        }
    });
    const mlInfo = mlResponse.body;
    const projectId = mlInfo.project;
    if (!projectId) throw new Error('Could not resolve project from mlInfo');

    // Call the new tensorboard API with project and backend_id
    const tensorboardResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseApiUrl}/api/projects/${projectId}/tensorboard?backend_id=${ml_id}`,
        headers: {
            Authorization: `Token ${apiToken}`
        },
        responseType: 'json'
    });

    const { tensorboard_url, proxy_url, dashboard_url, ...rest } = tensorboardResponse.body;

    return {
        tensorboard_url: tensorboard_url || '',
        ml_url: proxy_url || '',
        dashboard_url: dashboard_url || '',
        ...rest
    }
}