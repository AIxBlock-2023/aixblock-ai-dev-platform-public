import React, { useCallback, useMemo, useState } from "react";
import {useParams} from "react-router-dom";
import Button from "@/components/Button/Button";
import Select from "@/components/Select/Select";
import {useMyCheckpoints} from "@/hooks/settings/ml/useMyCheckpoints";
import {TProjectModel} from "@/models/project";
import styles from "./DemoDeploy.module.scss";
import {useMyModelSources} from "@/hooks/settings/ml/useMyModelSources";
import ComputeSelect, {TSelectedComputes} from "@/components/ComputeSelect/ComputeSelect";
import {useGetListMarketplaceGpus} from "@/hooks/settings/ml/useGetListMarketplaceGpus";
import {useApi} from "@/providers/ApiProvider";
import {useLoader} from "@/providers/LoaderProvider";
// import EmptyContent from "@/components/EmptyContent/EmptyContent";
import { toastError, toastSuccess } from "@/utils/toast";
import Switch from "@/components/Switch/Switch";
import InputBase from "@/components/InputBase/InputBase";
import {useDeployHistory} from "@/hooks/settings/ml/useDeployHistory";
import { getDeployBackendStatusText, TDeployBackend } from "@/models/deployHistory";
import useDebouncedEffect from "@/hooks/useDebouncedEffect";
import Demo from "./Demo";
import {formatDateTime} from "@/utils/formatDate";
import {openNewTab} from "@/utils/openNewTab";
import { useCentrifuge } from "@/providers/CentrifugoProvider";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { createAlertInfo } from "@/utils/createAlert";

type TDemoAndDeployProps = {
  project: TProjectModel | null;
  onAddCompute?: () => void;
  onRentCompute?: () => void;
  canCreateNewEndpoint?: boolean;
}

export default function DemoDeploy(props: TDemoAndDeployProps) {
  const {call} = useApi();
  const {project, onAddCompute, onRentCompute} = props;
  const params = useParams();
  const projectID = useMemo(
    () => project?.id ? project?.id : parseInt(params?.projectID ?? "0"),
    [project?.id, params?.projectID],
  );
  const {loading: loadingAvailableGpus, gpusListModel: availableGpusListModel} = useGetListMarketplaceGpus(project?.id, "0", "model-training", "1");
  // const {loading: loadingUsingGpus, gpusListModel: usingGpusListModel} = useGetListMarketplaceGpus(project?.id, "0", "model-training", "1");
  const loadingGpus = useMemo(() => loadingAvailableGpus , [loadingAvailableGpus]);
  const gpusListModel = useMemo(() => [...availableGpusListModel], [availableGpusListModel]);
  const {checkpoint, loading: loadingCheckpoints} = useMyCheckpoints({project_id: projectID.toString()});
  const {modelSourceList, loading: loadingModelSources} = useMyModelSources({project_id: projectID.toString()});
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedComputes, setSelectedComputes] = React.useState<TSelectedComputes>({
    cpus: [],
    gpus: [],
  });
  const {waitingForPromise} = useLoader();
  const [deploy, setDeploy] = React.useState<TDeployBackend|null>(null);
  const [autoScale, setAutoScale] = React.useState(false);
  const [numScale, setNumScale] = React.useState(1);
  const history = useDeployHistory({project_id: projectID})
  // const [downloadCheckpoint, setDownloadCheckpoint] = useState<string>("");
  const {onMessage} = useCentrifuge();
  const [, copy] = useCopyToClipboard();

  const modelSourceOptions = useMemo(() => modelSourceList.map(s => ({
    label: `#${s.id} | ${s.docker_image}`,
    value: s.id.toString(),
  })), [modelSourceList]);

  const isScalable = useMemo(() => {
    let scalable = false;
    const selectedComputeIds: number[] = [
      ...selectedComputes.cpus.reduce((p: number[], c) => [...p, Number(c)], []),
      ...selectedComputes.gpus.reduce((p: number[], c) => [...p, Number(c.compute_id)], []),
    ];

    gpusListModel.forEach(g => {
      if (!selectedComputeIds.includes(g.compute_id)) {
        return;
      }

      if (g.is_scale) {
        scalable = true;
      }
    });

    return scalable;
  }, [gpusListModel, selectedComputes]);

  const doDeploy = useCallback(() => {
    const body = new FormData();
    body.append("project_id", projectID?.toString());
    body.append("model_id", selectedModelId);
    body.append("checkpoint_id", selectedCheckpointId);
    body.append("num_scale", (isScalable && autoScale ? numScale : 1).toString());
    body.append("gpus", JSON.stringify(selectedComputes.gpus));

    const ar = call("deploy", {body});

    ar.promise
      .then(r => {
        if (r.ok) {
          // history.refresh();
          const currentPath = window.location.pathname;
          const targetPath = `/deploy/${projectID}/demo-and-deploy`;
          if (currentPath === targetPath) {
            window.location.reload();
          }
          setSelectedCheckpointId("");
          setSelectedComputes({cpus: [], gpus: []});
          setSelectedModelId("");
          return;
        }
        
        // Parse JSON response to extract error message
        return r.json().then(errorData => {
          const errorMessage = errorData.message || "An unknown error occurred.";
          toastError(`An error occurred while deploying model. Error: ${r.status} / ${r.statusText}. Details: ${errorMessage}`);
        }).catch(() => {
          // Fallback in case JSON parsing fails
          toastError(`An error occurred while deploying model. Error: ${r.status} / ${r.statusText}. Could not parse error details.`);
        });
      })
      .catch(e => {
        if (e instanceof Error) {
          toastError("An error occurred while deploying model. Error: " + e.message);
        } else {
          toastError("An error occurred while deploying model. Error: " + e.toString());
        }
      });

    waitingForPromise(ar.promise, "Deploying...");
  }, [projectID, selectedModelId, selectedCheckpointId, isScalable, autoScale, numScale, selectedComputes.gpus, call, waitingForPromise]);

  useDebouncedEffect(() => {
    try {
      if (history.list.length > 0 && "id" in history.list[0].compute_gpu) {
        setDeploy(history.list[0]);
        return;
      }
    } catch {
    }

    setDeploy(null)
  }, [history.list])

  useDebouncedEffect(() => {
    // console.log("aaa", projectID)
    const unsub = onMessage("project/" + projectID + "/deploy-history", () => {
      // console.log(msg)
      const currentPath = window.location.pathname;
      const targetPath = `${projectID}/demo-and-deploy`;
      
      if (currentPath.includes(targetPath)) {
        window.location.reload();
      }
      // history.refresh();
      // history.refresh().catch(e => {
      //   console.log(history)
      //   window.APP_SETTINGS.debug && console.error(e);
      // });
    });

    return () => {
      unsub();
    }
  }, [projectID]);

  // if (history.loading) {
  //   return (
  //     <EmptyContent message="Checking deploy history..." />
  //   );
  // }
  // console.log(deploy)

  // if (deploy) {
  //   return (
  //     <EmptyContent
  //       message={"Serving: " + deploy.url}
  //       buttons={[
  //         {children: "Stop", onClick: () => setDeploy(null)},
  //       ]}
  //     />
  //   );
  // }

  const installStatus: TDeployBackend["install_status"] | null = useMemo(() => {
    return deploy?.install_status ?? null;
  }, [deploy]);

  const demoContent = useMemo(() => {
    if (!project) {
      return null;
    }

    if (installStatus === "compleated") {
      return <Demo project={project}/>;
    } else if (installStatus === "installing" || installStatus === "reinstalling") {
      return <EmptyContent message="Model installation is in progress. This may take a few minutes or more depending on the model size, and we'll notify you via email once completed." />;
    }

    return null;
  }, [installStatus, project]);

  const deployUrl = useMemo(() => {
    if (!deploy || deploy.install_status === "installing") {
      return null;
    }

    return deploy.url.endsWith("/")
      ? deploy.url.replace("None://", "http://") + ""
      : deploy.url.replace("None://", "http://") + "/";
  }, [deploy]);

  return (
    <div className={styles.layout}>
      <div className={styles.columnDeploy}>
        {!history.initialized && history.loading && (
          <EmptyContent message="Loading deployment information..." />
        )}
        {history.initialized && (
          <>
            {deploy && (
              <div className={styles.currentDeploy} style={{marginTop: 0}}>
                <h4 className={styles.heading}>
                  Current Deployment
                  {
                    history.loading
                      ? <span>Loading...</span>
                      : <span className={ styles.headingLink } onClick={ () => history.refresh() }>Refresh</span>
                  }
                </h4>
                {deployUrl && createAlertInfo("Your API endpoint is now live and ready for use! Refer to the API Documents for detailed usage instructions.", false)}
                <InputBase
                  label="API Endpoint URL"
                  // value={deployUrl ? (deployUrl + "action") : "Installation in progress..."}
                  value={deployUrl ? (deployUrl) : "Installation in progress..."}
                  readonly
                  allowClear={false}
                />
                {deployUrl && (
                  <div className={styles.copyOpen}>
                    <Button size="tiny" onClick={() => {
                      copy(deployUrl).then(() => {
                        toastSuccess("Endpoint URL has been copied");
                      });
                    }} isBlock>
                      Copy
                    </Button>
                    <Button size="tiny" onClick={() => openNewTab(deployUrl + "swagger/#/default/post_action")} isBlock>
                      API Documents
                    </Button>
                  </div>
                )}
                <InputBase
                  label="Source"
                  value={
                    modelSourceList.find(m => m.id === deploy.deploy_history?.model_id)?.docker_image ?? "(unknown source)"
                  }
                  readonly
                  allowClear={false}
                />
                <InputBase
                  label="Checkpoint"
                  value={
                    checkpoint[0]?.options.find(o => o.value === deploy.deploy_history?.checkpoint_id?.toString())?.label ?? "(default checkpoint)"
                  }
                  readonly
                  allowClear={false}
                />
                <InputBase
                  label="Deployed At"
                  value={formatDateTime(deploy.created_at)}
                  readonly
                  allowClear={false}
                />
              </div>
              // <EmptyContent
              //   message={"Serving: " + deploy.url}
              //   buttons={[
              //     {children: "Stop", onClick: () => setDeploy(null)},
              //   ]}
              // />
            )}
            {props.canCreateNewEndpoint && (
              <div className={styles.currentDeploy} style={{marginTop: deploy ? "" : 0}}>
                <h4 className={styles.heading}>Create a new endpoint</h4>
                <div>
                  <p className={styles.label}>Model Source <span style={{color: "red"}}>*</span></p>
                  <div className={styles.modelSelect}>
                    <Select
                      isLoading={loadingModelSources}
                      data={[{options: modelSourceOptions}]}
                      onChange={(val) => setSelectedModelId(val.value)}
                      placeholderText="Select model source"
                    />
                  </div>
                </div>
                <div>
                  <p className={styles.label}>Checkpoint</p>
                  <div className={styles.modelSelect}>
                    <Select
                      isLoading={loadingCheckpoints}
                      data={checkpoint}
                      onChange={(val) => {
                        setSelectedCheckpointId(val.value);
                      }}
                      placeholderText="Select checkpoint"
                    />
                  </div>
                </div>
                <div>
                  <div className={styles.modelSelect}>
                    <ComputeSelect
                      isLoading={loadingGpus}
                      computes={gpusListModel}
                      selected={selectedComputes}
                      onChange={v => setSelectedComputes(v)}
                      isRequired={true}
                    />
                    {(onAddCompute || onRentCompute) && (
                      <div className={styles.addComputes}>
                        <span onClick={onAddCompute}>Add compute</span>
                        <span onClick={onRentCompute}>Rent compute</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className={styles.autoScale}>
                    <Switch
                      label="Auto-scale"
                      checked={autoScale && isScalable}
                      onChange={v => setAutoScale(v)}
                      disabled={!isScalable}
                    />
                    {autoScale && (
                      <InputBase
                        autoFocus
                        allowClear={false}
                        isControlledValue
                        type="number"
                        value={numScale.toString()}
                        onChange={ev => {
                          const newVal = parseInt(ev.target.value);
                          setNumScale(isNaN(newVal) ? 1 : Math.max(newVal, 1));
                        }}
                        style={{width: 75, textAlign: "center"}}
                      />
                    )}
                  </div>
                </div>
                <div className={styles.action}>
                  {/*<Button type="secondary" className={styles.cancel}>
                    Cancel
                  </Button>*/}
                  <Button
                    className={styles.deploy}
                    disabled={
                      /*selectedCheckpointId.trim().length === 0
                      ||*/ selectedModelId.trim().length === 0
                      || selectedComputes.cpus.length + selectedComputes.gpus.length === 0
                    }
                    onClick={doDeploy}
                    isBlock
                  >
                    Create
                  </Button>
                </div>
              </div>
            )}
            {deployUrl && (
              <div className={ styles.currentDeploy }>
                <h4 className={ styles.heading }>Download Model</h4>
                {/*<div>
                  <div className={ styles.modelSelect }>
                    <Select
                      isLoading={ loadingCheckpoints }
                      data={ checkpoint }
                      onChange={ (val) => {
                        setDownloadCheckpoint(val.value);
                      } }
                      placeholderText="Select version"
                    />
                  </div>
                </div>*/}
                <InputBase
                  label="Endpoint URL"
                  value={deployUrl + "downloads"}
                  readonly
                  allowClear={false}
                />
                <div className={ styles.action }>
                  <Button
                    size="tiny"
                    className={ styles.deploy }
                    onClick={() => {
                      // openNewTab("/api/checkpoint_model_marketplace/download/" + downloadCheckpoint + "?project_id=" + props.project?.id)
                      openNewTab(deployUrl + "/swagger/#/default/get_downloads")
                    }}
                    isBlock
                  >
                    Document
                  </Button>
                </div>
              </div>
            )}
            <div className={styles.currentDeploy}>
              <h4 className={ styles.heading }>
                History ({ history.list.length })
                {
                  history.loading
                    ? <span>Loading...</span>
                    : <span className={ styles.headingLink } onClick={ () => history.refresh() }>Refresh</span>
                }
              </h4>
              {history.list.length === 0 && (
                <div style={{textAlign: "center"}}>(empty list)</div>
              )}
              { history.list.map((h) => {
                const cp = checkpoint?.[0]?.options
                  .find(o => o.value === h.deploy_history?.checkpoint_id?.toString());
                const m = modelSourceList.find(m => m.id === h.deploy_history?.model_id);

                return (
                  <div key={ "deploy-history-" + h.id } className={ styles.history }>
                    <div><strong>Status:</strong> { getDeployBackendStatusText(h.install_status) }</div>
                    <div><strong>Source:</strong> { m?.docker_image ?? "(unknown source)" }</div>
                    <div><strong>Checkpoint:</strong> { cp?.label ?? "(default checkpoint)" }</div>
                    <div className={ styles.historyTime }>{ formatDateTime(h.created_at) }</div>
                  </div>
                );
              }) }
            </div>
          </>
        )}
      </div>
      <div className={styles.columnDemo}>
        {demoContent}
      </div>
    </div>
  )
}
