import { CaretDownIcon, PlusIcon } from '@radix-ui/react-icons';
import { WorkflowClientEventName } from 'axb-embed-sdk';
import { LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useStepSettingsContext } from '../builder/step-settings/step-settings-context';

import { useEmbedding } from '@/components/embed-provider';
import { SelectOption } from '@/hooks/aixblock-hooks';
import { parentWindow } from '@/lib/utils';

export const formatBytes = (bytes: number, decimals?: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(decimals ?? 2)} ${units[i]}`;
};

type TrainLinkToMarketPropType = {
  handleGetListCompute: (projectId: string) => void;
  isFetchCpu: boolean;
  listCompute: SelectOption[];
};

function TrainLinkToMarket({
  handleGetListCompute,
  isFetchCpu,
  listCompute,
}: TrainLinkToMarketPropType) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { embedState } = useEmbedding();
  const params = useParams();
  const navigate = useNavigate();
  const { selectedStep } = useStepSettingsContext();
  const handleClientRouteChange = (route: string) => {
    parentWindow.postMessage(
      {
        type: WorkflowClientEventName.CLIENT_ROUTE_CHANGED,
        data: {
          flowId: params.flowId,
          route: route,
        },
      },
      '*',
    );
  };

  const handleGoViewGpuFlow = () => {
    navigate(`step/${selectedStep.name}`);
  };

  const hasComputes = listCompute.length > 0;

  if (!embedState.isEmbedded) return null;

  return (
    <div>
      <div className="mt-2">
        {/* Khối chung có border bo tròn */}
        <div
          className={`border transition-all group ${
            isExpanded
              ? 'rounded-md shadow-sm border-primary'
              : 'rounded-md border-gray-300'
          }`}
        >
          {/* Ô select header */}
          <div
            className={`
                  px-4 py-2 flex items-center justify-between cursor-pointer min-h-[40px] 
                  ${hasComputes ? 'hover:bg-gray-50' : ''}
                  ${isExpanded ? 'rounded-t-md' : 'rounded-md'}`}
            onClick={() => hasComputes && setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">
                {isFetchCpu ? (
                  <div className="flex justify-center ">
                    <LoaderCircleIcon className="animate-spin duration-1500" />
                  </div>
                ) : (
                  `${listCompute.length} compute${
                    listCompute.length > 1 ? 's' : ''
                  }`
                )}
              </span>
              {!isFetchCpu && (
                <button
                  className="hidden group-hover:inline-flex ml-1 text-xs text-primary hover:underline items-center transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetListCompute('0');
                  }}
                >
                  Refresh
                </button>
              )}
              {!isFetchCpu && hasComputes && (
                <div className="hidden group-hover:inline-flex transition-all duration-200 text-xs text-primary ">
                  <span className="mx-1">|</span>
                  <button
                    className="hover:underline items-center"
                    onClick={handleGoViewGpuFlow}
                  >
                    View
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-row">
              {/* <button className="ml-auto text-xs text-primary hover:block">
                    <ReloadIcon></ReloadIcon>
                  </button> */}
              {hasComputes && (
                <span
                  className={`transform transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                >
                  <CaretDownIcon />
                </span>
              )}
            </div>

            {/* Nút Add Compute khi không có list */}
            {!hasComputes && (
              <button
                className="ml-auto text-xs text-primary hover:underline flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClientRouteChange('/marketplace/computes');
                }}
              >
                <PlusIcon /> Add Compute
              </button>
            )}
            {/* Nút Reload chỉ hiện khi hover thẻ div cha */}
          </div>

          {/* Expandable list nằm trong border chung */}
          {hasComputes && (
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isExpanded ? 'max-h-[999px]' : 'max-h-0'
              }`}
            >
              <ul className="space-y-2 p-2 border-t border-gray-200">
                {listCompute.map((item, itemId) => (
                  <li
                    key={itemId}
                    className="p-2 rounded-xs hover:shadow-md hover:bg-gray-100 transition duration-300 text-xs"
                  >
                    <h3 className="text-xs">{item.label}</h3>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrainLinkToMarket;
