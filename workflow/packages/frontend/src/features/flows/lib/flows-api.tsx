import { t } from 'i18next';
import {
  CreateFlowRequest,
  ErrorCode,
  FlowGpu,
  FlowOperationRequest,
  FlowTemplate,
  FlowVersion,
  FlowVersionMetadata,
  GetFlowQueryParamsRequest,
  GetFlowTemplateRequestQuery,
  ListFlowsRequest,
  ListFlowVersionRequest,
  ListingCategory,
  ListingCategoryMetadata,
  PopulatedFlow,
  SeekPage,
} from 'workflow-shared';

import { DelistingFlowRequest } from '../../../../../shared/src/lib/flows/dto/delisting-flow-request';
import { ListingFlowRequest } from '../../../../../shared/src/lib/flows/dto/listing-flow-request';

import { Button } from '@/components/ui/button';
import { toast, UNSAVED_CHANGES_TOAST } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

export const flowsApi = {
  list(request: ListFlowsRequest): Promise<SeekPage<PopulatedFlow>> {
    return api.get<SeekPage<PopulatedFlow>>('/v1/flows', request);
  },
  create(request: CreateFlowRequest) {
    return api.post<PopulatedFlow>('/v1/flows', request);
  },
  update(
    flowId: string,
    request: FlowOperationRequest,
    showErrorToast = false,
  ) {
    return api
      .post<PopulatedFlow>(`/v1/flows/${flowId}`, request)
      .catch((error) => {
        if (showErrorToast) {
          const errorCode: ErrorCode | undefined = (
            error.response?.data as { code: ErrorCode }
          )?.code;
          if (errorCode === ErrorCode.FLOW_IN_USE) {
            toast({
              title: t('Flow Is In Use'),
              description: t(
                'Flow is being used by another user, please try again later.',
              ),
              duration: Infinity,
              action: (
                <Button
                  onClick={() => window.location.reload()}
                  size={'sm'}
                  variant={'outline'}
                >
                  {t('Refresh')}
                </Button>
              ),
            });
          } else {
            toast(UNSAVED_CHANGES_TOAST);
          }
        }
        throw error;
      });
  },
  getTemplate(flowId: string, request: GetFlowTemplateRequestQuery) {
    return api.get<FlowTemplate>(`/v1/flows/${flowId}/template`, {
      params: request,
    });
  },
  get(
    flowId: string,
    request?: GetFlowQueryParamsRequest,
  ): Promise<PopulatedFlow> {
    return api.get<PopulatedFlow>(`/v1/flows/${flowId}`, request);
  },
  listVersions(
    flowId: string,
    request: ListFlowVersionRequest,
  ): Promise<SeekPage<FlowVersionMetadata>> {
    return api.get<SeekPage<FlowVersion>>(
      `/v1/flows/${flowId}/versions`,
      request,
    );
  },
  delete(flowId: string) {
    return api.delete<void>(`/v1/flows/${flowId}`);
  },
  count() {
    return api.get<number>('/v1/flows/count');
  },
  listing(flowId: string, request: ListingFlowRequest): Promise<PopulatedFlow> {
    return api.post<PopulatedFlow>(`/v1/flows/${flowId}/listing`, request);
  },
  delisting(
    flowId: string,
    request: DelistingFlowRequest,
  ): Promise<PopulatedFlow> {
    return api.post<PopulatedFlow>(`/v1/flows/${flowId}/delisting`, request);
  },
  getListingCategories(): Promise<SeekPage<ListingCategoryMetadata>> {
    return api.get<SeekPage<ListingCategory>>(`/v1/flows/listing-categories`);
  },
  getUserGpus(): Promise<FlowGpu[]> {
    return api.get<FlowGpu[]>(`/v1/flows/marketplace/compute/gpus`);
  },
  v2: {
    list(request: ListFlowsRequest): Promise<SeekPage<PopulatedFlow>> {
      return api.get<SeekPage<PopulatedFlow>>('/v2/flows', request);
    },
  },
};
