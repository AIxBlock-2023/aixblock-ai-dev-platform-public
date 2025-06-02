import { useApi } from "@/providers/ApiProvider";
import { useEffect } from "react";
import styles from './WorkflowEditor.module.scss';

const containerId = "workflow-editor-container"

type WorkflowEditorType = {
  projectId?: number;
  netWorkId?: number;
};

function WorkflowEditor({ projectId, netWorkId }: WorkflowEditorType) {
  const api = useApi();
  useEffect(() => {
    const init = async () => {
    if (!projectId || !netWorkId) return;
      try {
        const ar = api.call("getWorkflowByProjectId", {
          query: new URLSearchParams({
            project_id: projectId?.toString(),
            ml_network_id: netWorkId?.toString(),
          }),
        });
        const response = await ar.promise;
        const data: { flow_id: string, token: string, workflow_endpoint: string } = await response.json()
        const flowId = data.flow_id;
        const token = data.token;
        if (!flowId || !token) return;
        await window.pwf.configure({
          prefix: "/",
          instanceUrl: data.workflow_endpoint,
          jwtToken: data.token,
          embedding: {
            containerId: containerId,
            builder: {
              disableNavigation: true,
              hideLogo: true,
              hideFlowName: false,
            },
            dashboard: {
              hideSidebar: true,
            },
            hideFolders: true,
            navigation: {
              handler: ({ route }: any) => {
                window.pwf.navigate({
                  route: `/flows/${flowId}`,
                });
              },
            },
          },
        });
        window.pwf.navigate({
          route: `/flows/${flowId}`,
        });
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, [api, projectId, netWorkId]);

  return (
    <div id={containerId} className={styles.WorkflowEditorContainer} />
  );
}

export default WorkflowEditor;
