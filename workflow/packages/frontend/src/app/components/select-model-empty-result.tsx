import { useEmbedding } from '@/components/embed-provider';
import { parentWindow } from '@/lib/utils';
import { WorkflowClientEventName } from 'axb-embed-sdk';
import { useParams } from 'react-router-dom';

type SelectModelEmptyResultPropType = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  linkToModelMarketplace?: boolean;
  showUseHuggingFaceOption?: boolean;
};

function SelectModelEmptyResult({
  setOpen,
  showUseHuggingFaceOption,
  linkToModelMarketplace,
}: SelectModelEmptyResultPropType) {
  const { embedState } = useEmbedding();
  const params = useParams();
  const handleClientRouteChange = (route: string) => {
    setOpen(false);
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

  const handleGoToHuggingFaceModel = () => {
    const modelHubIdElement = document.querySelector(
      'div[data-panel-id="right-sidebar"] div[data-field-id="model_hub_id"]',
    );

    if (modelHubIdElement) {
      const editor = (modelHubIdElement as any).editor;

      if (editor) {
        setOpen(false);
        editor.chain().focus('all').scrollIntoView().run();
      }
    }
  };

  if (!embedState.isEmbedded) return null;

  return (
    <div className="flex gap-2 flex-col p-1 text-muted-foreground">
      {linkToModelMarketplace && (
        <div
          onClick={() => handleClientRouteChange('/marketplace/models')}
          className="relative cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground flex gap-2 flex-col items-start"
        >
          <div className="flex gap-2 items-center justify-between w-full">
            Go to Marketplace Model
          </div>
        </div>
      )}
      {showUseHuggingFaceOption && (
        <div
          onClick={handleGoToHuggingFaceModel}
          className="relative cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground flex gap-2 flex-col items-start"
        >
          <div className="flex gap-2 items-center justify-between w-full">
            Use HuggingFace Model
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectModelEmptyResult;
