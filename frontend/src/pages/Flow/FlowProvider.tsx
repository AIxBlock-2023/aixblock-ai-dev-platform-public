import {Outlet, useLocation, useNavigate, useParams} from "react-router-dom";
import React, {useCallback, useEffect, useRef} from "react";
import {FLOW_NAMES, TProjectModel} from "@/models/project";
import useProjectHook, {TUseProjectHook} from "@/hooks/project/useProjectHook";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import {useBooleanLoader} from "@/providers/LoaderProvider";
import {useAllListDataStorage} from "@/hooks/settings/cloudStorage/useGetListStorage";
import {TRentedGpuResponse, useRentedGpu} from "@/hooks/computes/useRentedGpu";
import {useMyCheckpoints} from "@/hooks/settings/ml/useMyCheckpoints";
import {toastError, toastSticky, toastSuccess} from "@/utils/toast";
import {FlowItem} from "./Shared/Workflow";
import {useRentedModelList} from "@/hooks/settings/ml/useRentedModelList";
import {useGetListMarketplaceGpus} from "@/hooks/settings/ml/useGetListMarketplaceGpus";
import {useUserLayout} from "@/layouts/UserLayout";
import {Id, toast} from "react-toastify";
import DataPipelineDialog from "./Shared/DataPipeline/DataPipelineDialog";
import {confirmDialog} from "@/components/Dialog";
import {useDeleteCompute} from "@/hooks/computes/useDeleteCompute";
import useProjectPermission from "@/hooks/project/useProjectPermission";
import {useAuth} from "@/providers/AuthProvider";
import WorkflowEditor from "@/components/WorkflowEditor";
import Modal from "@/components/Modal/Modal";
import {TNavbarBreadcrumb} from "@/components/Navbar/Navbar";

export type TPageFlowProvider = {
  project: TProjectModel | null;
  isLoading: boolean;
  patchProject: TUseProjectHook["patchProject"],
  refreshProject: TUseProjectHook["refresh"],
  storages: ReturnType<typeof useAllListDataStorage>,
  computes: Omit<ReturnType<typeof useRentedGpu>, "list"> & {
    list: TRentedGpuResponse["results"],
    rented: TRentedGpuResponse["results"],
    delete: (id: number) => void,
  },
  checkpoints: ReturnType<typeof useMyCheckpoints>,
  models: ReturnType<typeof useRentedModelList>,
  initialized: boolean,
  isMeetRequirements: boolean,
  setMeetRequirements: (v: boolean) => void,
  flowDiagram: FlowItem[],
  setFlowDiagram: React.Dispatch<React.SetStateAction<FlowItem[]>>,
  switchDataPipeline: (v: boolean, onFinish?: () => void) => void,
  gotoSelfHostWithReturn: () => void,
  gotoComputeMarketplaceWithReturn: () => void,
  setShowPipeline: React.Dispatch<React.SetStateAction<boolean>>,
  systemStorages: {
    source: number[],
    target: number[],
  },
  flowStatus: {
    isInitialized: boolean,
    hasStorage: boolean,
    hasCompute: boolean,
    hasData: boolean,
    hasCheckpoint: boolean,
    hasMlAssisted: boolean,
    hasAutoTrain: boolean,
    hasAddedModel: boolean,
    hasRentedModel: boolean,
  },
  permission: ReturnType<typeof useProjectPermission>,
  showWorkflow: () => void,
  sharedNavbarActions: TNavbarBreadcrumb[],
}

const FLOW_CONTEXT_DEFAULT: TPageFlowProvider = {
  project: null,
  isLoading: false,
  patchProject: () => void 0,
  refreshProject: () => void 0,
  storages: {
    list: null,
    exportList: null,
    error: null,
    loading: false,
    refresh: () => void 0,
    initialized: true,
  },
  computes: {
    list: [],
    rented: [],
    error: null,
    loading: false,
    refresh: () => new Promise(() => void 0),
    page: 1,
    pageSize: 1000,
    setPage: () => void 0,
    setPageSize: () => void 0,
    initialized: true,
    delete: () => void 0,
  },
  checkpoints: {
    initialized: true,
    loading: false,
    error: null,
    checkpoint: [],
    listSelectProject: [],
  },
  models: {
    loading: false,
    initialized: true,
    error: null,
    listData: null,
    page: 1,
    pageSize: 100,
    setPage: () => void 0,
    setPageSize: () => void 0,
    refresh: () => new Promise(() => void 0),
  },
  initialized: true,
  isMeetRequirements: true,
  setMeetRequirements: () => void 0,
  flowDiagram: [],
  setFlowDiagram: () => void 0,
  switchDataPipeline: () => void 0,
  systemStorages: {source: [], target: []},
  gotoSelfHostWithReturn: () => void 0,
  gotoComputeMarketplaceWithReturn: () => void 0,
  setShowPipeline: () => void 0,
  flowStatus: {
    isInitialized: false,
    hasStorage: false,
    hasCompute: false,
    hasData: false,
    hasCheckpoint: false,
    hasMlAssisted: false,
    hasAddedModel: false,
    hasRentedModel: false,
    hasAutoTrain: false,
  },
  permission: {
    configure: false,
    delete: false,
    import: false,
    export: false,
    bulkDeleteTask: false,
    bulkDeleteAnnotations: false,
    bulkDeletePredictions: false,
    retrievePredictions: false,
    createAnnotationsFromPredictions: false,
    replaceTaskHandler: false,
    unparkTask: false,
  },
  showWorkflow: () => void 0,
  sharedNavbarActions: [],
}

export const PageFlowContext = React.createContext<TPageFlowProvider>(FLOW_CONTEXT_DEFAULT);

function FlowProviderWithProject({id, children, computes, flowDiagram, setFlowDiagram}: React.PropsWithChildren<{id: number} & Pick<TPageFlowProvider, "computes" | "flowDiagram" | "setFlowDiagram">>) {
  const [isMeetRequirements, setIsMeetRequirements] = React.useState<boolean>(true);
  const [showPipeline, setShowPipeline] = React.useState<boolean>(false);
  const {detail, loading, initialized: projectInitialized, loadingError, fetchData, patchProject} = useProjectHook(id);
  const storages = useAllListDataStorage(id);
  const navigate = useNavigate();
  const checkpoints = useMyCheckpoints({project_id: id.toString()});
  const models = useRentedModelList({project_id: id.toString()});
  const location = useLocation();
  const layout = useUserLayout();
  const {state} = useLocation();
  const lastLocation = useRef<string>(location.pathname);
  const {user} = useAuth();
  const permission = useProjectPermission({project: detail, user});
  const [isShowWorkflow, setShowWorkflow] = React.useState(false);
  const [sharedNavbarActions] = React.useState<TNavbarBreadcrumb[]>([]);

  useBooleanLoader(!projectInitialized && loading, "Loading project...");
  useBooleanLoader(
    (!storages.initialized && storages.loading)
    || (!computes.initialized && computes.loading)
    || (!checkpoints.initialized && checkpoints.loading)
    || (!models.initialized && models.loading),
    "Checking requirements...",
  );

  React.useEffect(() => {
    if (!state || !("redirectError" in state)) return;

    let hasClosed = true;
    let id: Id;

    const timeout = setTimeout(() => {
      id = toastError(state.redirectError, {
        autoClose: 10000,
        pauseOnFocusLoss: false,
        onOpen: () => hasClosed = false,
        onClose: () => hasClosed = true,
      });
    }, 500);

    return () => {
      clearTimeout(timeout);

      if (hasClosed || !id) {
        return;
      }

      toast.dismiss(id);
    };
  }, [state]);

  const initialized = React.useMemo(() => {
    return storages.initialized && computes.initialized && models.initialized;
  }, [computes.initialized, models.initialized, storages.initialized]);

  const setMeetRequirements = React.useCallback((v: boolean) => {
    setIsMeetRequirements(v);
  }, [setIsMeetRequirements]);

  const switchDataPipeline = React.useCallback((v: boolean, onFinish?: () => void) => {
    const closeToast = toastSticky((v ? "Enabling" : "Disabling") + " data pipeline...");

    patchProject({data_pipeline: v ? "on" : "off"}, false, () => {
      onFinish?.();
      closeToast();
      toastSuccess((v ? "Enabled" : "Disabled") + " data pipeline");
    }, e => {
      closeToast();
      toastError(e instanceof Error ? e.message : e);
    });
  }, [patchProject]);

  const modelsList = React.useMemo(() => {
    return models.listData?.results ? models.listData.results.filter(h => !!h.model_marketplace) : []
  }, [models.listData?.results]);

  const hasStorage = React.useMemo(() => (storages.list?.length ?? 0) > 0, [storages.list?.length]);
  const hasCompute = React.useMemo(() => computes.list.length > 0, [computes.list.length]);
  const hasData = React.useMemo(() => (detail?.task_number ?? 0) > 0, [detail?.task_number]);
  const hasAddedModel = React.useMemo(() => modelsList.filter(m => m.type === "add").length > 0, [modelsList]);
  const hasRentedModel = React.useMemo(() => modelsList.filter(m => m.type === "rent").length > 0, [modelsList]);
  const hasCheckpoint = React.useMemo(() => checkpoints.checkpoint.length > 0 && checkpoints.checkpoint[0].options.length > 0, [checkpoints.checkpoint]);
  const hasMlAssisted = React.useMemo(() => (
    !!(detail && (
      detail.show_collab_predictions
      || detail.evaluate_predictions_automatically
      || detail.export_dataset
    ))
  ), [detail]);

  const hasAutoTrain = React.useMemo(() => (
    !!detail
    && ["train-and-deploy", "fine-tune-and-deploy"].includes(detail.flow_type ?? "")
    // && detail.start_training_on_annotation_update
  ), [detail]);

  const isSystemStorage = React.useCallback((s: any) => {
    // const server = (window.APP_SETTINGS.storage_server ?? "").trim();
    return false
    // return server.length > 0
    //   && "type" in s
    //   && s["type"] === "s3"
    //   && "s3_endpoint" in s
    //   && s["s3_endpoint"].indexOf(window.APP_SETTINGS.storage_server) > -1;
  }, []);

  const systemStorages: TPageFlowProvider["systemStorages"] = React.useMemo(() => {
    const source: number[] = [];
    const target: number[] = [];

    (storages.list ?? []).forEach(s => {
      if (isSystemStorage(s)) {
        source.push(Number(s["id"]));
      }
    });

    (storages.exportList ?? []).forEach(s => {
      if (isSystemStorage(s)) {
        target.push(Number(s["id"]));
      }
    });
    return {source, target};
  }, [isSystemStorage, storages.exportList, storages.list]);

  const gotoSelfHostWithReturn = React.useCallback(() => {
    localStorage.setItem("computes-return", JSON.stringify({name: "Project: " + detail?.title, url: location.pathname}));
    navigate("/infrastructure/setup-gpu/self-host");
  }, [detail?.title, location.pathname, navigate]);

  const gotoComputeMarketplaceWithReturn = React.useCallback(() => {
    localStorage.setItem("computes-return", JSON.stringify({name: "Project: " + detail?.title, url: location.pathname}));
    navigate("/marketplace/computes");
  }, [detail?.title, location.pathname, navigate]);

  // Validate flow URL
  React.useEffect(() => {
    if (!detail || loading) {
      return;
    }

    // Valid URL
    if (detail.flow_type && location.pathname.startsWith("/" + detail.flow_type)) {
      return;
    }

    // Projects created before implement flows
    if (!detail.flow_type) {
      navigate("/projects/" + detail.id);
      return;
    }
    // Wrong URL, redirect to valid URL
    else if (detail.flow_type in FLOW_NAMES) {
      navigate("/" + detail.flow_type + "/" + detail.id);
      return;
    }
    // Wrong database flow type
    else {
      toastError("Wrong flow type");
      navigate("/projects/");
      return;
    }
  }, [detail, location, navigate, loading]);

  React.useEffect(() => {
    if (!detail
      || detail.task_number === 0
      || detail.data_pipeline === "on"
      || detail.flow_type === "label-and-validate-data"
      || (location.state && "redirectError" in location.state)
    ) {
      lastLocation.current = location.pathname;
      return;
    }

    const dpPath = "/" + detail.flow_type + "/" + detail.id + "/data-preparation";

    if (!location.pathname.startsWith(dpPath) && lastLocation.current.startsWith(dpPath)) {
      confirmDialog({
        title: "Data Pipeline",
        message: "Do you need a labeling tool?",
        submitText: "Yes",
        onSubmit: () => {
          switchDataPipeline(true);
          setShowPipeline(true);
        },
      });
    }

    lastLocation.current = location.pathname;
  }, [detail, location.pathname, location.state, switchDataPipeline]);

  React.useEffect(() => {
    layout.setNavDataProject(detail);

    return () => {
      layout.clearNavDataProject();
    }
  }, [detail, layout]);

  // React.useEffect(() => {
  //   if (!detail?.id || modelsList.length === 0) {
  //     setSharedNavbarActions([]);
  //   } else {
  //     setSharedNavbarActions([
  //       {
  //         label: "Automation Workflow",
  //         actionType: "success",
  //         onClick: () => setShowWorkflow(true),
  //       },
  //     ]);
  //   }
  // }, [detail?.id, modelsList.length]);

  const showWorkflow = React.useCallback(() => setShowWorkflow(true), []);

  if (loading || !projectInitialized) {
    return null;
  }

  if (loadingError) {
    return (
      <EmptyContent
        message={loadingError}
        buttons={[
          {
            children: "Back to project list",
            onClick: () => navigate("/projects/"),
            type: "primary",
          },
          {
            children: "Retry",
            onClick: () => fetchData(),
            type: "hot",
          },
        ]}
      />
    );
  }

  if (!detail) {
    return (
      <EmptyContent
        message="Project not found"
        buttons={[
          {
            children: "Back to project list",
            onClick: () => navigate("/projects/"),
            type: "primary",
          },
          {
            children: "Retry",
            onClick: () => fetchData(),
            type: "hot",
          },
        ]}
      />
    );
  }

  return (
    <PageFlowContext.Provider value={{
      project: detail,
      isLoading: loading,
      patchProject,
      refreshProject: fetchData,
      storages,
      computes,
      models: {
        ...models,
        listData: {
          count: modelsList.length,
          next: models.listData?.next ?? null,
          previous: models.listData?.previous ?? null,
          results: modelsList,
        },
      },
      checkpoints,
      initialized,
      isMeetRequirements,
      setMeetRequirements,
      flowDiagram,
      setFlowDiagram,
      switchDataPipeline,
      systemStorages,
      gotoSelfHostWithReturn,
      gotoComputeMarketplaceWithReturn,
      setShowPipeline,
      flowStatus: {
        isInitialized: initialized,
        hasStorage,
        hasCompute,
        hasData,
        hasCheckpoint,
        hasMlAssisted,
        hasAddedModel,
        hasRentedModel,
        hasAutoTrain,
      },
      permission,
      showWorkflow,
      sharedNavbarActions,
    }}>
      {children}
      {!!detail && (
        <DataPipelineDialog
          show={showPipeline}
          project={detail}
          patchProject={patchProject}
          onClose={() => setShowPipeline(false)}
          hasMLAssisted={hasMlAssisted}
          hasAutoTrain={hasAutoTrain}
        />
      )}
      <Modal
        title="Workflow"
        open={isShowWorkflow}
        onClose={() => setShowWorkflow(false)}
        className="workflow-modal"
      >
        <WorkflowEditor projectId={detail.id} netWorkId={-1} />
      </Modal>
    </PageFlowContext.Provider>
  )
}

function FlowProviderWithoutProject({children, ...props}: React.PropsWithChildren<Pick<TPageFlowProvider, "computes" | "flowDiagram" | "setFlowDiagram">>) {
  return (
    <PageFlowContext.Provider value={{
      ...FLOW_CONTEXT_DEFAULT,
      ...props,
      flowStatus: {
        ...FLOW_CONTEXT_DEFAULT.flowStatus,
        hasCompute: props.computes.list.length > 0,
      },
    }}>
      {children}
    </PageFlowContext.Provider>
  )
}

export default function FlowProvider() {
  const [flowDiagram, setFlowDiagram] = React.useState<FlowItem[]>([]);
  const {id} = useParams();
  const intId = parseInt(id ?? "0");
  // query gpu and installed successfully
  const gpus = useGetListMarketplaceGpus(intId.toString(), "0", 'model-training');
  const computes = useRentedGpu({ page: 1, pageSize: 1000, fieldQuery: 'compute_marketplace.is_using_cpu,compute_install', valueQuery: 'false,completed' });
  const deleteComputeHook = useDeleteCompute();

  const availableComputes: TPageFlowProvider["computes"]["list"] = React.useMemo(() => {
    const gpuIds: number[] = [];

    gpus.gpusListModel.forEach(g => {
      g.compute_gpus.forEach(g => gpuIds.push(g.id));
    });

    return !!computes.list?.results
      ? computes.list.results.filter(c => {
        return c.compute_install === "completed" && gpuIds.includes(c.compute_gpu.id);
        // && (c.service_type === "full" || c.service_type === "model-training");
      })
      : [];
  }, [computes.list?.results, gpus.gpusListModel]);

  const rentedComputes: TPageFlowProvider["computes"]["rented"] = React.useMemo(() => {
    return computes.list?.results ?? [];
  }, [computes.list?.results]);

  const computesRefresh = React.useCallback(async () => {
    await Promise.all([computes.refresh(), gpus.refresh()]);
  }, [computes, gpus]);

  const deleteCompute = useCallback((id: number, project_id?: number) => {
    confirmDialog({
      message: "Are you sure you want to delete this compute?",
      onSubmit() {
        deleteComputeHook.delete(id, project_id).promise
          .then(r => {
            if (!r.ok) return;
            computesRefresh();
          });
      },
    });
  }, [deleteComputeHook, computesRefresh]);

  useEffect(() => {
    if (!deleteComputeHook.error) return;
    toastError(deleteComputeHook.error);
  }, [deleteComputeHook.error]);

  return intId > 0 ? (
    <FlowProviderWithProject
      id={parseInt(id ?? "0")}
      computes={{...computes, list: availableComputes, rented: rentedComputes, refresh: computesRefresh, delete: deleteCompute}}
      flowDiagram={flowDiagram}
      setFlowDiagram={setFlowDiagram}
    >
      <Outlet />
    </FlowProviderWithProject>
  ) : (
    <FlowProviderWithoutProject
      computes={{...computes, list: availableComputes, rented: rentedComputes, refresh: computesRefresh, delete: deleteCompute}}
      flowDiagram={flowDiagram}
      setFlowDiagram={setFlowDiagram}
    >
      <Outlet />
    </FlowProviderWithoutProject>
  );
}

export function useFlowProvider() {
  return React.useContext(PageFlowContext);
}
