import { useCallback, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { infoDialog } from "@/components/Dialog";
import TabContainer from "@/components/TabsV2/TabContainer";
import useMLNetWork from "@/hooks/settings/ml/useMLNetwork";
import { TMLBackend } from "@/models/mlBackend";
import { TProjectModel } from "@/models/project";
import { useApi } from "@/providers/ApiProvider";
import { useAuth } from "@/providers/AuthProvider";
import { usePromiseLoader } from "@/providers/LoaderProvider";
import Dashboard from "../../Project/Settings/ML/Dashboard/Index";
import { MLStatus } from "./Node/Index";
import styles from "./TrainingDashboard.module.scss";
import TrainingNodes from "./TrainingNodes/Index";
import useMLBackendHook from "@/hooks/settings/ml/useMLBackendHook";
import {TUseProjectHook} from "@/hooks/project/useProjectHook";
import useDebouncedEffect from "@/hooks/useDebouncedEffect";
import {useCentrifuge} from "@/providers/CentrifugoProvider";

type TTrainingDashboardProps = {
  project: TProjectModel | null;
  patchProject: TUseProjectHook["patchProject"];
}

export default function TrainingDashboard(props: TTrainingDashboardProps) {
  const { project, patchProject } = props;
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { call } = useApi();
  const { user } = useAuth();
  const projectID = useMemo(() => {
    return project?.id ? project?.id : parseInt(params?.projectID ?? "0");
  }, [project?.id, params?.projectID]);
  const { dataNetWork, refresh: refreshNetWorkList } = useMLNetWork(projectID);
  const [proxyUrl, setProxyUrl] = useState("");
  const [currentNetWorkId, setCurrentNetWorkId] = useState<number | undefined>();
  const [backendDashboard, setBackendDashboard] = useState<TMLBackend | null>(null);
  const {list: mlList, refresh: refreshMlList, loading: mlLoading} = useMLBackendHook(projectID, currentNetWorkId);
  const { addPromise } = usePromiseLoader();
  const {onMessage} = useCentrifuge()

  useDebouncedEffect(() => {
    const unsubs = mlList.map(ml => onMessage(`ml_${ml.id}`, () => refreshMlList()));

    return () => {
      unsubs.forEach(cb => cb());
    }
  }, [mlList, refreshMlList]);

  const hasMaster = useMemo(
    () => mlList.filter((m) => m.status === "master").length > 0,
    [mlList]
  );

  const masterNodes = useMemo(() => {
    return mlList.filter((ml) => ml.status === MLStatus.MASTER);
  }, [mlList]);

  const workerNodes = useMemo(() => {
    return mlList.filter((ml) => ml.status !== MLStatus.MASTER);
  }, [mlList]);

  const getAutoCardMerge = useCallback(async () => {
    try {
      if (user?.id) {
        const ar = call("getAutoMergeCard", {
          query: new URLSearchParams({
            user_id: user?.id.toString(),
            project_id: projectID.toString(),
          }),
        });
        const res = await ar.promise;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const jsonData = await res.json();
      }
    } catch (error) {
      console.log(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, user?.id, addPromise]);

  const onDeletedMl = useCallback(() => {
    refreshNetWorkList();
    refreshMlList();
  }, [refreshMlList, refreshNetWorkList]);

  const resetContainer = useCallback(() => {
    const ar = call("resetMlPort", {
      query: new URLSearchParams({
        project_id: projectID.toString(),
      }),
    });

    addPromise(ar.promise, "Reseting ML port...");

    ar.promise
      .then(async (r) => {
        if (!r.ok) {
          return;
        }

        const data = await r.json();
        setProxyUrl(data.proxy_url);
      })
      .catch((e) => {
        if (e instanceof Error) {
          infoDialog({ title: "Error", message: e.message });
        } else if (typeof e === "object" && Object.hasOwn(e, "detail")) {
          infoDialog({ title: "Error", message: e["detail"] });
        } else {
          infoDialog({ title: "Error", message: e });
        }
      });
  }, [call, projectID, addPromise]);

  const tabs = useMemo(() => {
    if (!project) {
      return null;
    }

    return dataNetWork.ml_network?.map((c: any, index: number) => {
      return {
        label: c.name,
        content: <TrainingNodes
          proxyUrl={proxyUrl}
          masterNodes={masterNodes}
          workerNodes={workerNodes}
          hasMaster={hasMaster}
          refreshMlList={refreshMlList}
          onDeletedMl={onDeletedMl}
          openDashboard={setBackendDashboard}
          resetContainer={resetContainer}
          centrifugeToken={user?.centrifuge_token ?? ""}
          project={project}
          netWorkId={currentNetWorkId}
          isLoadingNode={mlLoading}
          patchProject={patchProject}
        />,
        key: index + 1,
        netWorkId: c.id,
      }
    });
  }, [currentNetWorkId, dataNetWork.ml_network, hasMaster, masterNodes, mlLoading, onDeletedMl, project, proxyUrl, refreshMlList, resetContainer, user?.centrifuge_token, workerNodes, patchProject]);

  useDebouncedEffect(() => {
    if (currentNetWorkId) {
      const ar = call("getMlPort", {
        query: new URLSearchParams({
          project_id: projectID.toString(),
          network_id: currentNetWorkId?.toString() ?? ""
        }),
      });

      ar.promise
        .then(async (r) => {
          if (!r.ok) {
            return;
          }

          const data = await r.json();
          setProxyUrl(data.proxy_url);
        })
        .catch((e) => {
          if (ar.controller.signal.aborted) {
            return;
          }

          if (e instanceof Error) {
            infoDialog({ title: "Error", message: e.message });
          } else if (typeof e === "object" && Object.hasOwn(e, "detail")) {
            infoDialog({ title: "Error", message: e["detail"] });
          } else {
            infoDialog({ title: "Error", message: e });
          }

          if (window.APP_SETTINGS.debug) {
            console.error(e);
          }
        });
      getAutoCardMerge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, projectID, currentNetWorkId]);

  useDebouncedEffect(() => {
    if (dataNetWork && dataNetWork.ml_network && dataNetWork.ml_network.length > 0) {
      setCurrentNetWorkId(dataNetWork.ml_network[0].id);
    }
  }, [dataNetWork]);

  if (backendDashboard) {
    return (
      <div className="c-content-settings" style={{ display: "flex", flex: 1, minHeight: "auto" }}>
        <Dashboard
          backend={backendDashboard}
          onClose={() => setBackendDashboard(null)}
        />
      </div>
    );
  }

  return (
    <div className={styles.trainingDashboard}>
      <h3 className={styles.heading}>Training Nodes</h3>
      <div>
        {tabs && tabs.length > 0 ?
          <TabContainer
            setCurrentTab={setCurrentNetWorkId}
            key={`key-${tabs}`}
            tabs={tabs}
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            project={project}
            showRoutingBtn={false}
            showWorkFlowBtn={false}
          />
          : <span className="c-ml__last-text">No Result</span>}
      </div>
      <div>&nbsp;</div>
    </div>
  )
}
