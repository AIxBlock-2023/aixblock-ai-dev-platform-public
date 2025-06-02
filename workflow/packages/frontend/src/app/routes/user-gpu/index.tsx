import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LoaderCircleIcon } from 'lucide-react';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import GpuDiagram from './gpu-diagram';

import { CaretLeftIcon } from '@radix-ui/react-icons';

import { Button } from '@/components/ui/button';

import { useQuery } from '@tanstack/react-query';

import { flowsApi } from '@/features/flows/lib/flows-api';
import { FlowGpu, PopulatedFlow } from 'workflow-shared';

const UserGpuPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { data: gpus, isLoading } = useQuery<FlowGpu[], Error>({
    queryKey: [],
    queryFn: () => flowsApi.getUserGpus(),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: flow, isLoading: isFetchFlow } = useQuery<PopulatedFlow, Error>(
    {
      queryKey: ['flow', params.flowId],
      queryFn: () => flowsApi.get(params.flowId || ''),
      gcTime: 0,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );
  const handleGoBack = () => {
    navigate(`/projects/${params.projectId}/flows/${params.flowId}`);
  };

  return (
    <ReactFlowProvider>
      <div className="w-full h-auto">
        <div className="absolute left-2 top-2 z-[1009] flex items-center">
          <Button
            variant="outline-primary"
            className="w-[75px] px-2"
            onClick={handleGoBack}
          >
            <CaretLeftIcon height="2rem" width="2rem" />
            Back
          </Button>
          <h3 className="ml-2 font-semibold text-xl select-none">
            {isFetchFlow ? (
              <LoaderCircleIcon className="animate-spin duration-1500" />
            ) : (
              flow?.version.displayName
            )}
          </h3>
          <span className="mx-1">/</span>
          <span className="italic select-none">{params.stepId}</span>
        </div>
        <GpuDiagram datasource={gpus} />
      </div>
    </ReactFlowProvider>
  );
};

export default UserGpuPage;
