import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { ALL_PRINCIPAL_TYPES, PrincipalType } from 'workflow-shared';
import { aixblockService } from './aixblock.service';

export const aixblockModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(aixblockController, { prefix: '/v1/aixblock' });
};

const aixblockController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/provider/models', GetProvider, async (request) => {
        return aixblockService(request.log).getAIxBlockProviderModel(request);
    });
    app.get('/provider/info', GetProvider, async (request) => {
        return aixblockService(request.log).getAIxBlockProviderInfo(request);
    });
    app.post('/provider/upsert-data/:flowId', GetProvider, async (request) => {
        return aixblockService(request.log).upsertData(request);
    });
    app.get('/provider/get-data/:flowId', GetProvider, async (request) => {
        return aixblockService(request.log).getData(request);
    });
    app.get('/mapping-pieces-metadata', GetPieceMetadata, async (request) => {
        return aixblockService(request.log).mappingPiecesMetadata(request);
    })
};

const GetProvider = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
    },
    schema: {
    },
};

const GetPieceMetadata = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
    },
};
