import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import {
    ALL_PRINCIPAL_TYPES,
    ApId,
    FLOW_RUN_ID_QUERY_PARAM_NAME,
    FLOW_VERSION_ID_QUERY_PARAM_NAME,
    Permission,
    PrincipalType,
    STEP_NAME_QUERY_PARAM_NAME,
    USE_DRAFT_QUERY_PARAM_NAME
} from 'workflow-shared';
import { aixblockWebFormsService } from './aixblock-web-forms.service';

export const aixblockWebFormsModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(aixblockWebFormsController, { prefix: '/v1/aixblock-web-forms' });
};

const aixblockWebFormsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/form/:flowId', GetFormRequest, async (request) => {
        return aixblockWebFormsService(request.log).getFormByFlowIdOrThrow(request.params.flowId, request.query.useDraft ?? false);
    });
    app.get('/form-action/:flowId', GetFormActionRequest, async (request) => {
        return aixblockWebFormsService(request.log).getFormActionByFlowIdOrThrow(
            request.params.flowId,
            request.query.stepName,
            request.query.flowRunId,
            request.query.useDraft ?? false
        );
    });
    app.post('/form-action/submit-form-to-store/:flowId', SubmitFormToStoreRequest, async (request) => {
        return aixblockWebFormsService(request.log).submitFormToStore(request);
    });
    app.get('/form-action/get-form-data/:flowId', GetFormDataByFlowIdRequest, async (request) => {
        return aixblockWebFormsService(request.log).getFormDataFromStoreByFlowId(request);
    });
    app.delete('/form-action/delete-form-data/:flowId', DeleteFormDataByFlowIdRequest, async (request) => {
        return aixblockWebFormsService(request.log).deleteDataFromStoreByFlowId(request);
    });
    app.get('/chat/:flowId', GetFormRequest, async (request) => {
        return aixblockWebFormsService(request.log).getChatUIByFlowIdOrThrow(request.params.flowId, request.query.useDraft ?? false);
    });
    app.get("/sample", SampleWebForm, async (request) => {
        // const ai = AI({
        //     provider: 'aixblock',
        //     server: {
        //         apiUrl: 'http://localhost:4000/',
        //         publicUrl: 'http://localhost:4200/api',
        //         token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpZCI6InhocElnSmFONkNDN0lta2l2QVIxZCIsInR5cGUiOiJVU0VSIiwicHJvamVjdElkIjoiVW1NV2d1QTdnVmtqZG9VTm1sc3lGIiwicGxhdGZvcm0iOnsiaWQiOiIzSmhieWZOcjdMSHN0MXBaZnpraWUifSwidG9rZW5WZXJzaW9uIjoiTmduRkt0SUg0YzMwOThxU29SZnRnIiwiaWF0IjoxNzQ1Mzc5MTM3LCJleHAiOjE3NDU5ODM5MzcsImlzcyI6ImFjdGl2ZXBpZWNlcyJ9.nJF4A7D-GTTqKi8boLs0FiJ7QMuVPU5NPWHMaTJ48EA',
        //     },
        //     flowId: 'EuwerxQS3EwzHyYuOYN8E',
        // });
        // const resp = await ai.chat.text({
        //     model: '146',
        //     messages: [
        //         {
        //             role: AIChatRole.USER,
        //             content: 'talk me about bill gate',
        //         },
        //     ],
        // });
        // console.log(resp)
        // return resp;
    })
};

const GetFormRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permission: Permission.WRITE_PROJECT_MEMBER,
    },
    schema: {
        description: 'Get a form by flow id',
        params: Type.Object({
            flowId: ApId,
        }),
        querystring: Type.Object({
            [USE_DRAFT_QUERY_PARAM_NAME]: Type.Optional(Type.Boolean()),
        }),
    },
};

const GetFormActionRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permission: Permission.WRITE_PROJECT_MEMBER,
    },
    schema: {
        description: 'Get a form action by flow id',
        params: Type.Object({
            flowId: ApId,
        }),
        querystring: Type.Object({
            [USE_DRAFT_QUERY_PARAM_NAME]: Type.Optional(Type.Boolean()),
            [STEP_NAME_QUERY_PARAM_NAME]: Type.String(),
            [FLOW_RUN_ID_QUERY_PARAM_NAME]: Type.String(),
        }),
    },
};

const SubmitFormToStoreRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permission: Permission.WRITE_PROJECT_MEMBER,
    },
    schema: {
        description: 'Submit form to store',
        params: Type.Object({
            flowId: ApId,
        }),
        querystring: Type.Object({
            [USE_DRAFT_QUERY_PARAM_NAME]: Type.Optional(Type.Boolean()),
            [STEP_NAME_QUERY_PARAM_NAME]: Type.String(),
            [FLOW_VERSION_ID_QUERY_PARAM_NAME]: Type.String(),
            [FLOW_RUN_ID_QUERY_PARAM_NAME]: Type.String(),
        }),
    },
};

const GetFormDataByFlowIdRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
        permission: Permission.WRITE_PROJECT_MEMBER,
    },
    schema: {
        description: 'Submit form to store',
        params: Type.Object({
            flowId: ApId,
        }),
        querystring: Type.Object({
            [STEP_NAME_QUERY_PARAM_NAME]: Type.String(),
            projectId: Type.String(),
            [FLOW_VERSION_ID_QUERY_PARAM_NAME]: Type.String(),
            [FLOW_RUN_ID_QUERY_PARAM_NAME]: Type.String(),
        }),
    },
};

const DeleteFormDataByFlowIdRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
        permission: Permission.WRITE_PROJECT_MEMBER,
    },
    schema: {
        description: 'Submit form to store',
        params: Type.Object({
            flowId: ApId,
        }),
        querystring: Type.Object({
            [STEP_NAME_QUERY_PARAM_NAME]: Type.String(),
            projectId: Type.String(),
            [FLOW_VERSION_ID_QUERY_PARAM_NAME]: Type.String(),
            [FLOW_RUN_ID_QUERY_PARAM_NAME]: Type.String(),
        }),
    },
};

const SampleWebForm = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        description: 'Sample web orm',
    },
};
