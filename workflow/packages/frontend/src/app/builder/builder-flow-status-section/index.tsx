import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { FlowVersionState, Permission } from 'workflow-shared';

import SellButton from '@/app/builder/builder-flow-status-section/sell-button';
import { userHooks } from '@/hooks/user-hooks';
import { PublishButton } from './publish-button';
import { EditFlowOrViewDraftButton } from './view-draft-or-edit-flow-button';
const BuilderFlowStatusSection = React.memo(() => {
  const { checkAccess } = useAuthorization();
  const { data } = userHooks.useCurrentUser();
  const userHasPermissionToUpdateFlowStatus = checkAccess(
    Permission.UPDATE_FLOW_STATUS,
  );
  const [flowVersion, flow, readonly, setFlow] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.flow,
    state.readonly,
    state.setFlow,
  ]);
  const showFlowStatusSection =
    (!readonly || flow.publishedVersionId === flowVersion.id) &&
    userHasPermissionToUpdateFlowStatus;
  return (
    <>
      {showFlowStatusSection && (
        <>
          {flow.publishedVersionId && (
            <div className="flex items-center space-x-2">
              <FlowVersionStateDot
                state={flowVersion.state}
                versionId={flowVersion.id}
                publishedVersionId={flow.publishedVersionId}
              ></FlowVersionStateDot>
              {(flow.publishedVersionId === flowVersion.id ||
                flowVersion.state === FlowVersionState.DRAFT) && (
                <FlowStatusToggle
                  flow={flow}
                  flowVersion={flowVersion}
                ></FlowStatusToggle>
              )}
            </div>
          )}
        </>
      )}
      <EditFlowOrViewDraftButton />
      <PublishButton />
    </>
  );
});

BuilderFlowStatusSection.displayName = 'BuilderFlowStatusSection';
export { BuilderFlowStatusSection };

