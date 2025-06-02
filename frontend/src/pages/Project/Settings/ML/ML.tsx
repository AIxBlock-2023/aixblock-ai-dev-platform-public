import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  IconCirclePlus,
  IconHome,
  IconInfo,
} from "@/assets/icons/Index";
import Button from "@/components/Button/Button";
import { confirmDialog, infoDialog } from "@/components/Dialog";
import InputBase from "@/components/InputBase/InputBase";
import {
  Config,
  MLStatus,
  initConfigs,
} from "@/components/ManageConnect/ManageConnect";
import Modal from "@/components/Modal/Modal";
import Notice from "@/components/Notice/Notice";
import Select, {
  DataSelect,
  SelectOption,
} from "@/components/Select/Select";
import Switch from "@/components/Switch/Switch";
import { useMyCheckpoints } from "@/hooks/settings/ml/useMyCheckpoints";
import { useGetDatasetModel } from "@/hooks/settings/ml/useGetDatasetModel";
import { useGetListMarketplaceGpus } from "@/hooks/settings/ml/useGetListMarketplaceGpus";
import { TProjectModel } from "@/models/project";
import { TApiCallResult, useApi } from "@/providers/ApiProvider";
import {useLoader, usePromiseLoader} from "@/providers/LoaderProvider";
import LayoutSettings from "../LayoutSettings/Index";
import BuyModelMarketplaceForm from "./BuyModel/Index";
import "./ML.scss";
import useMLBackendHook from "@/hooks/settings/ml/useMLBackendHook";
import { TMarketplaceGpuModel } from "@/models/marketplaceGpu";
import { Gpus } from "@/hooks/settings/ml/useUpdateModelMarketplace";
import { IModelData } from "./ModelDetail/Index";
import { TMLBackend } from "@/models/mlBackend";
import Dashboard from "./Dashboard/Index";
import { useAuth } from "@/providers/AuthProvider";
import AppLoading from "@/components/AppLoading/AppLoading";
import Checkbox from "@/components/Checkbox/Checkbox";
import { downloadFile } from "@/utils/downloadFile";
import NodeML from "./Node/Index";
import TabContainer from "@/components/TabsV2/TabContainer";
import useMLNetWork from "@/hooks/settings/ml/useMLNetwork";
import EmptyContent from "@/components/EmptyContent/EmptyContent";


type TMLProps = {
  data?: TProjectModel | null;
};
export interface IAddModelData {
  name: string;
  port: string | null;
  gpus_index: string;
  docker_image: string | null;
  docker_access_token: string | null;
  model_desc: string;
  file: any;
  compute_id: number;
  computes: SelectOption[];
  model_source: string;
  model_id: string;
  model_token: string;
  checkpoint_source: string;
  checkpoint_id: string;
  checkpoint_token: string;
  check_sequential_sampling_tasks: boolean;
  check_random_sampling: boolean;
  weight?: string | null;
}


interface StoreInputFieldsType {
  projectID: number;
  [key: string]: any;
}

const adddModelDataDefault = {
  name: "",
  port: null,
  gpus_index: "0",
  docker_image: "",
  docker_access_token: "",
  model_desc: "",
  file: "",
  compute_id: 0,
  computes: [],
  model_source: "",
  model_id: "",
  model_token: "",
  checkpoint_source: "",
  checkpoint_id: "",
  checkpoint_token: "",
  check_sequential_sampling_tasks: false,
  check_random_sampling: false,
}

export const storeInputFields = (data: StoreInputFieldsType) => {
  const local = localStorage.getItem("modelSettingInput");
  let modelSettingInputs: StoreInputFieldsType[] = [];
  if (local) {
    modelSettingInputs =
      JSON.parse(localStorage.getItem("modelSettingInput") ?? "") ?? [];
  }

  const currentInputs = modelSettingInputs.find(
    (item: StoreInputFieldsType) => item.projectID === data.projectID
  );
  if (currentInputs) {
    const updatedInputs = modelSettingInputs.map((item: StoreInputFieldsType) =>
      item.projectID === data.projectID ? { ...item, ...data } : item
    );
    localStorage.setItem("modelSettingInput", JSON.stringify(updatedInputs));
  } else {
    modelSettingInputs.push(data);
    localStorage.setItem(
      "modelSettingInput",
      JSON.stringify(modelSettingInputs)
    );
  }
};

export const getStoreInputFields = (projectID:number) =>{
  const local= localStorage.getItem("modelSettingInput");
  if(!local){
    return;
  }
  const modelSettingInputs: StoreInputFieldsType[] =
    JSON.parse(local) ?? [];
  const currentInputs = modelSettingInputs.find(
    (item) => item.projectID === projectID
  );
  if (currentInputs) {
    return currentInputs;
  }
  return undefined;
}


export const removeStoreInputFields = (projectID: number) => {
  const local = localStorage.getItem("modelSettingInput");
  if(!local){
    return;
  }
  const modelSettingInputs: StoreInputFieldsType[] =
    JSON.parse(local) ?? [];
  const updatedInputs = modelSettingInputs.filter(
    (item) => item.projectID !== projectID
  );
  localStorage.setItem("modelSettingInput", JSON.stringify(updatedInputs));
};

const ML = (props: TMLProps) => {
  const [data, setData] = useState<TProjectModel | null>(props.data ?? null);
  const params = useParams();
  const {addPromise} = usePromiseLoader();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useAuth();
  const [isOpenModalModel, setOpenModalModel] = useState<boolean>(false);
  // eslint-disable-next-line
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [defaultValueDataSet, setDefaultValueDataSet] = useState({
    label: "Select",
    value: "",
  });
  const [defaultValueCheckpoint, setDefaultValueCheckpoint] = useState({
    label: "Select",
    value: "",
  });
  const [modelData, setModelData] = useState<IModelData>({} as IModelData);
  const { call } = useApi();
  const [checkpointId, setCheckpointId] = useState<string>("");
  const [datasetId, setDatasetId] = useState<string>("");
  const [addModelData, setAddModelData] = React.useState<IAddModelData>(adddModelDataDefault);
  const [backendDashboard, setBackendDashboard] = React.useState<TMLBackend | null>(null);
  const isFetchComputes = useRef(false);
  const [paramsValue, setParamsValue] = useState<number | undefined>();

  const projectID = useMemo(() => {
    return data?.id ? data?.id : parseInt(params?.projectID ?? "0");
  }, [data?.id, params?.projectID]);

  const { gpusListModel, refresh: refreshGpus, loading: gpusLoading } = useGetListMarketplaceGpus(
    projectID.toString()
  );
  const { checkpoint } = useMyCheckpoints({ project_id: projectID.toString() });
  const { dataset } = useGetDatasetModel(projectID?.toString());
  const [selectedGpus, setSelectedGPUs] = React.useState<Gpus[]>([]);
  const [selectedCpus, setSelectedCPUs] = React.useState<Gpus[]>([]);
  const [currentNetWorkId, setCurrentNetWorkId] = useState<number | undefined>();
  const {
    list: mlList,
    refresh: refreshMlList,
    loading: mlLoading,
  } = useMLBackendHook(projectID, currentNetWorkId);
  const { dataNetWork, refresh: refreshNetWorkList } = useMLNetWork(projectID);
  const { createLoader } = useLoader();
  const [validationErrors, setValidationErrors] = useState<{
    [k: string]: string[];
  }>({});
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [proxyUrl, setProxyUrl] = useState("");
  const [isOpenModalWaiting, setIsOpenModalWaiting] = useState(false);
  // eslint-disable-next-line new-parens
  const [changedTime, setChangedTime] = useState<Date>(new Date);
  const [oldData, setOldData] = React.useState<Gpus[]>([]);
  const [config, setConfig] = useState<{ [key: string]: Config }>(initConfigs);
  

  // useBooleanLoader(mlLoading, "Loading MLs...");
  const selectableGpus = useMemo(() => {
    const results: DataSelect[] = gpusListModel.map((j) => {
      const gpus =
        j.compute_gpus.length > 0
          ? j.compute_gpus.map(
            (c: TMarketplaceGpuModel) =>
            ({
              label: c.gpu_name,
              value: c.id.toString(),
              data: {
                compute_id: j.compute_id,
                gpu: c
              },
            } as SelectOption)
          )
          : [
            {
              label: j?.compute_cpu?.cpu,
              value: "compute_gpus",
              data: {
                compute_id: j.compute_id,
                cpu: j.compute_cpu
              },
            } as SelectOption,
          ];
      return {
        label: j.compute_name,
        options: gpus,
      };
    });
    return results;
  }, [gpusListModel]);

  const showModalModel = () => {
    setOpenModalModel(true);
    isFetchComputes.current = false
  };

  const closeModalModel = () => {
    setOpenModalModel(false);
    setAddModelData(adddModelDataDefault);
    setParamsValue(undefined);
  };

  const addCheckpoint = () => {
    api.call("updateCheckpointModelMarketplace", {
      params: { id: checkpointId },
      body: {
        project_id: projectID,
      },
    });
    handleDownloadCheckpoint(checkpointId)
  };

  const addDataset = () => {
    api.call("updateDatasetModelMarketplace", {
      params: { id: datasetId },
      body: {
        project_id: projectID,
      },
    });
    handleDownloadDataset(datasetId)
  };

  const handleDownloadDataset = useCallback((datasetId: string) => {
    confirmDialog({
      title: "Download",
      submitText: "OK",
      cancelText: "No",
      message: "Update is successfull. Do you want to download?",
      onSubmit: () => {
        setLoading(true);
        let response: TApiCallResult;

        response = api.call("downloadDataset", {
          params: { pk: datasetId },
          query: new URLSearchParams({
            project_id: projectID.toString(),
          }),
        })

        response.promise
        .then(async (res) => {
          if (response.controller.signal.aborted) return;
          const blob = await res.blob();
          if (blob) {
            downloadFile(blob, res.headers.get('filename') ?? "");
          };
        })
        .catch((e) => {
          if (response.controller.signal.aborted) {
            return;
          }

          let msg = "An error occurred while get data export";

          if (e instanceof Error) {
            msg += " Error: " + e.message + ".";
            setError(msg);
          }

          if (window.APP_SETTINGS.debug) {
            console.error(e);
          }
        })
        .finally(() => {
          if (response.controller.signal.aborted) return;
          setLoading(false);
        });
      }
        
  })} , [api, projectID]);

  const handleDownloadCheckpoint = useCallback((checkpointId: string) => {
    confirmDialog({
      title: "Download",
      submitText: "OK",
      cancelText: "No",
      message: "Update is successfull. Do you want to download?",
      onSubmit: () => {
        setLoading(true);
        let response: TApiCallResult;

        response = api.call("downloadCheckpoint", {
          params: { pk: checkpointId },
          query: new URLSearchParams({
            project_id: projectID.toString(),
          }),
        })

        response.promise
        .then(async (res) => {
          if (response.controller.signal.aborted) return;
          const blob = await res.blob();
          if (blob) {
            downloadFile(blob, res.headers.get('filename') ?? "");
          };
        })
        .catch((e) => {
          if (response.controller.signal.aborted) {
            return;
          }

          let msg = "An error occurred while get data export";

          if (e instanceof Error) {
            msg += " Error: " + e.message + ".";
            setError(msg);
          }

          if (window.APP_SETTINGS.debug) {
            console.error(e);
          }
        })
        .finally(() => {
          if (response.controller.signal.aborted) return;
          setLoading(false);
        });
      }
        
  })} , [api, projectID]);

  const updateProject = async (projectId: number, newData: Partial<TProjectModel>) => {
    try {
      const ar = api.call("updateProject", {
        params: { id: projectId.toString() },
        body: newData,
      });

      const res = await ar.promise;
      const data = await res.json();

      if (res.ok) {
        setData(data);
      }

      if (Object.hasOwn(data, "message")) {
        infoDialog({ message: data.message, className: "ml-nodes mgs-error", title: "Error" });
      } 
      
      if (Object.hasOwn(data, "detail")) {
        infoDialog({ message: data.detail, className: "ml-nodes mgs-error", title: "Error" });
      }

      if (Object.hasOwn(data, "validation_errors")) {
        infoDialog({ message: data.validation_errors, className: "ml-nodes mgs-error", title: "Error" });
      }

      if (!res.ok) {
        throw new Error(res.statusText);
      }

      setData(data);
    } catch (error) {
      console.error("Error updating data:", error);
      setError("Error updating data:");
    }
  };

  async function addModel() {
    setIsAdding(true);
    setIsOpenModalWaiting(true);
    try {
      const formData = new FormData();
      formData.append("name", addModelData.name);
      formData.append("docker_image", "");
      formData.append("docker_access_token", "");
      const configsBody = Object.keys(config).map(key => ({
        entry_file: config[key].entry_file,
        arguments: config[key].arguments,
        type: config[key].type
      }));
      
      if (addModelData.file) formData.append("file", addModelData.file);
      formData.append(
        "gpus",
        JSON.stringify(
          selectedGpus.map(function (gpu) {
            return {
              compute_id: gpu.compute_id?.toString(),
              gpus_id: gpu.gpus_id?.toString(),
            };
          })
        )
      );

      formData.append(
        "cpus_ids",
        selectedCpus
          .map(function (gpu) {
            return gpu.compute_id.toString();
          })
          .join(",")
      );
      formData.append("model_desc", addModelData.model_desc);
      formData.append("compute_id", addModelData.compute_id + "");
      formData.append("project_id", `${projectID}`);
      formData.append("model_info", JSON.stringify(modelData));

      formData.append("model_source", addModelData.model_source);
      formData.append("model_token", addModelData.model_token);
      formData.append("model_id", addModelData.model_id);
      formData.append("checkpoint_source", addModelData.checkpoint_source);
      formData.append("checkpoint_id", addModelData.checkpoint_id);
      formData.append("checkpoint_token", addModelData.checkpoint_token);
      formData.append("check_sequential_sampling_tasks", addModelData.check_sequential_sampling_tasks.toString());
      formData.append("check_random_sampling", addModelData.check_random_sampling.toString());
      formData.append("config", JSON.stringify(configsBody));
  
      const closeLoader = createLoader("Adding model...");
      const res = await fetch(
        window.APP_SETTINGS.hostname + "api/model_marketplace/add-model",
        {
          method: "post",
          body: formData,
        }
      );
      closeLoader();

      if (!res.ok) {
        const data = await res.json();

        if (Object.hasOwn(data, "validation_errors")) {
          setValidationErrors(data.validation_errors);
        }

        if (Object.hasOwn(data, "detail")) {
          infoDialog({ message: data["detail"] });
        }

        if (Object.hasOwn(data, "messages")) {
          infoDialog({ message: "Something went wrong!" });
        }
      } else {
        
        refreshMlList();
        refreshGpus()
        removeStoreInputFields(projectID);
      }
    } catch (error) {
      console.error(error); // It's a good practice to log errors
    } finally {
      refreshMlList();
      refreshGpus()
      removeStoreInputFields(projectID);
      setOpenModalModel(false);
      setIsOpenModalWaiting(false);
      setAddModelData(adddModelDataDefault);
      setParamsValue(undefined);
      setConfig(initConfigs);
    }
    setIsAdding(false);
  }

  const onFieldChange = useCallback(
    async (field: string, value: string | SelectOption[] | number | boolean | File) => {
      storeInputFields({
        projectID,
        [field]: value,
      });

      const updatedData = {
        ...addModelData,
        [field]: value,
      };
      setAddModelData(updatedData);
    },
    [addModelData, projectID]
  );

  function onUpload(file: any) {
    setAddModelData({
      ...addModelData,
      file,
    });
  }

  // useEffect(() => {
  //   const currentInputs = getStoreInputFields(projectID);
  //   if (currentInputs && selectableGpus.length > 0) {
  //     const { computes } = currentInputs;
  //     const parsedSelectableGpus = selectableGpus.flatMap((o) => o.options);
  //     const gpusCached = (computes ?? []).filter((o: any) =>
  //       parsedSelectableGpus.some((item) => item.value === o.value)
  //     );
  //     setAddModelData((state) => ({
  //       ...state,
  //       name: currentInputs.name,
  //       docker_image: currentInputs.docker_image,
  //       port: currentInputs.port,
  //       docker_access_token: currentInputs.docker_access_token,
  //       computes: gpusCached,
  //     }));
  //     const availableGpus = gpusCached.map((o: any) => ({
  //       compute_id: o.data.compute_id,
  //       gpus_id: o.value,
  //     }));

  //     onSelectComputes(availableGpus);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [projectID, selectableGpus]);

  const hasMaster = useMemo(
    () => mlList.filter((m) => m.status === "master").length > 0,
    [mlList]
  );

  useEffect(() => {
    const datasetDefault = dataset.find((item) =>
      item.options.some(
        (option) => option.data.project_id === projectID.toString()
      )
    );

    const checkpointDefault = checkpoint.find((item) =>
      item.options.some(
        (option) => option.data.project_id === projectID.toString()
      )
    );
    if (datasetDefault && datasetDefault.label) {
      setDefaultValueDataSet({
        label: datasetDefault?.options[0].label,
        value: datasetDefault?.options[0].value,
      });
      setDatasetId(datasetDefault?.options[0].value);
    }
    if (checkpointDefault && checkpointDefault.options.length) {
      setDefaultValueCheckpoint({
        label: checkpointDefault?.options[0].label,
        value: checkpointDefault?.options[0].value,
      });
      setCheckpointId(checkpointDefault?.options[0].value);
    }
  }, [dataset, checkpoint, data, projectID]);

  useEffect(() => {
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

  const masterNodes = useMemo(() => {
    return mlList.filter((ml) => ml.status === MLStatus.MASTER);
  }, [mlList]);

  const workerNodes = useMemo(() => {
    return mlList.filter((ml) => ml.status !== MLStatus.MASTER);
  }, [mlList]);

  useEffect(() => {
    setData(props.data ?? null);
  }, [props.data]);

  const getDataGpus = useCallback((data: Gpus[]) => {
    const cpus = data
      .filter((item) => item.gpus_id === "compute_gpus")
      .map(({ compute_id }) => ({ compute_id }));
    const mergedArray = data
      .filter((item) => item.gpus_id !== "compute_gpus")
      .reduce((acc, obj2) => {
        const existingObjIndex = acc.findIndex(
          (obj1) => obj1.compute_id === obj2.compute_id
        );

        if (existingObjIndex !== -1) {
          const gpuIdArray = (acc[existingObjIndex].gpus_id as string).split(
            ","
          );
          if (!gpuIdArray.includes(obj2.gpus_id ?? "")) {
            acc[existingObjIndex].gpus_id += "," + obj2.gpus_id;
          }
        } else {
          acc.push(obj2);
        }
        return acc;
      }, [] as Gpus[]);

    setSelectedCPUs(cpus as any);
    setSelectedGPUs(mergedArray as any);
    // eslint-disable-next-line new-parens
    setChangedTime(new Date);
  }, [setSelectedCPUs, setSelectedGPUs]);

  const onSelectComputes = useCallback((result: Gpus[]) => {
    setOldData(result);
  }, []);

  const confirmSelectComputes = () => {
    const isVirtualMachines = oldData.some((item) => item?.machine_options === "virtual-machines");
    const virtualList = addModelData.computes.filter((item) => item.data.gpu?.machine_options === "virtual-machines");
    const virtuaSelected = virtualList.map((item) => {
      return item.label;
    }).join(" - ");


    if (isVirtualMachines) {
      confirmDialog({
        message: `If you select ${virtuaSelected}, the data will be reset!`,
        onSubmit: () => {
          getDataGpus(oldData);
        },
        onCancel: () => {
          setAddModelData({
            ...addModelData,
            computes: addModelData.computes.filter((item) => item.data.gpu?.machine_options !== "virtual-machines")
          });
          setOldData([]);
          return
        }
      });
    } else {
      getDataGpus(oldData);
    }
  }

  const isLlmType = useMemo(() => {
    if (!data?.catalog_model_key) return false;
    return data?.catalog_model_key === "generative_ai"
      || data?.catalog_model_key === "llm"
      || data?.catalog_model_key === "nlp";
  }, [data?.catalog_model_key]);

  const isAsrType = useMemo(
    () => data?.catalog_model_key && data?.catalog_model_key === "audio_speech_processing",
    [data?.catalog_model_key]
  );

  const isCvType = useMemo(
    () => data?.catalog_model_key && data?.catalog_model_key === "computer_vision",
    [data?.catalog_model_key]
  );

  const isVideoType = useMemo(() => {
    return Object.keys(data?.data_types ?? {}).indexOf("video") > -1 || data?.catalog_model_key === "video";
  }, [data?.catalog_model_key, data?.data_types]);

  const onDeletedMl = () => {
    refreshNetWorkList();
    refreshMlList();
  };

  const tabs = useMemo(() => {
    return dataNetWork.ml_network?.map((c: any, index: number) => {
      return {
        label: c.name,
        content: <NodeML
          proxyUrl={proxyUrl}
          masterNodes={masterNodes}
          workerNodes={workerNodes}
          hasMaster={hasMaster}
          refreshMlList={refreshMlList}
          onDeletedMl={onDeletedMl}
          openDashboard={setBackendDashboard}
          resetContainer={resetContainer}
          centrifugeToken={user?.centrifuge_token ?? ""}
          projectID={projectID}
          netWorkId={currentNetWorkId}
          isLoadingNode={mlLoading}
        />,
        key: index + 1,
        netWorkId: c.id,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataNetWork, proxyUrl, masterNodes, workerNodes, hasMaster, mlLoading]);

  useEffect(() => {
    if (dataNetWork && dataNetWork.ml_network && dataNetWork.ml_network.length > 0) {
      setCurrentNetWorkId(dataNetWork.ml_network[0].id);
    }
  }, [dataNetWork]);

  useEffect(() => {
    if (!tabs || (tabs && tabs.length === 0)) {
      setSearchParams((prevSearchParams) => {
        const newSearchParams = new URLSearchParams(prevSearchParams);
        newSearchParams.delete("tab");
        return newSearchParams;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs]);

  if (backendDashboard) {
    return (
      <div className="c-content-settings" style={{ display: "flex" }}>
        <Dashboard
          backend={backendDashboard}
          onClose={() => setBackendDashboard(null)}
        />
      </div>
    );
  }

  if (error) {
    return <div className="c-ml m-229 loading-error">
      <EmptyContent message={error} buttons={[
        {
          children: "Retry",
          type: "hot",
          // onClick: () => refreshAnnotation(),
        }
      ]} />
    </div>
  }

  return (
    <div className="c-content-settings">
      <div className="c-ml m-303">
        {error && <Notice icon={<IconInfo />} title={error} status="error" />}
        <h4 className="c-ml__heading">Machine Learning</h4>
        <h4 className="c-ml__title">
          Add one or more machine learning models to predict labels for your
          data. To import predictions without connecting a model, see the
          documentation.
        </h4>

        <div className="c-ml__action">
          <Button
            type="dark"
            size="small"
            className="c-ml--action add"
            icon={<IconCirclePlus />}
            onClick={() => showModalModel()}
          >
            Add Your Model
          </Button>
          <Button
            type="dark"
            size="small"
            className="c-ml--action ml-marketplace"
            icon={<IconHome />}
            onClick={() => navigate("/marketplace/models/" + projectID)}
          >
            Check out from ML Models Marketplace
          </Button>
        </div>
        <div className="c-ml__assisted">
          <label className="c-ml__label">ML-Assisted Labeling</label>
          <div className="c-ml__assisted-item">
            <Switch
              label="Start model training after any annotations are submitted or updated"
              checked={data?.show_collab_predictions ?? false}
              onChange={(isChecked) =>
                updateProject(projectID, { show_collab_predictions: isChecked })
              }
            />
          </div>
          <div className="c-ml__assisted-item">
            <Switch
              label="Retrieve predictions when loading a task automatically"
              checked={data?.start_training_on_annotation_update ?? false}
              onChange={(isChecked) =>
                updateProject(projectID, { start_training_on_annotation_update: isChecked })
              }
            />
          </div>
          <div className="c-ml__assisted-item">
            <Switch
              label="Show predictions to annotators in the Label Stream and Quick View"
              checked={data?.evaluate_predictions_automatically ?? false}
              onChange={(isChecked) =>
                updateProject(projectID, { evaluate_predictions_automatically: isChecked })
              }
            />
          </div>
          <div className="c-ml__assisted-item">
            <Switch
              label="Automatically generate a new dataset version following human quality control checks."
              checked={data?.export_dataset ?? false}
              onChange={(isChecked) =>
                updateProject(projectID, { export_dataset: isChecked })
              }
            />
          </div>
        </div>
        <div className="c-ml__split">
          <div className="c-ml__split-left">
            <div className="c-ml__model top">
              <label className="c-ml__label">Model Version</label>
              <p className="c-ml__title">
                Model version allows you to specify which prediction will be
                shown to the annotators.
              </p>
              <div className="c-ml__model-select">
                <Select
                  defaultValue={defaultValueCheckpoint}
                  data={checkpoint}
                  onChange={(val) => {
                    setCheckpointId(val.value);
                  }}
                  className="c-ml__select-model"
                />
                <Button
                  type="hot"
                  onClick={() => {
                    addCheckpoint();
                  }}
                  className="c-ml--action reset"
                  // disabled={masterNodes.length === 0 && workerNodes.length === 0}
                >
                  Choose Version
                </Button>
              </div>
            </div>
            <div className="c-ml__model bottom">
              <label className="c-ml__label">Model Training</label>
              <div className="c-ml__training-lists">
                <div className="c-ml__training-item">
                  <label>Epochs</label>
                  <InputBase
                    value={data?.epochs?.toString() || ""}
                    allowClear={false}
                    className="c-ml__input-number"
                    placeholder="input number"
                    type="number"
                    onBlur={(e) => {
                      updateProject(projectID, { epochs: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 })
                    }}
                  />
                </div>
                <div className="c-ml__training-item">
                  <label>Batch Size</label>
                  <InputBase
                    value={data?.batch_size?.toString() || ""}
                    allowClear={false}
                    className="c-ml__input-number"
                    placeholder="input number"
                    type="number"
                    onBlur={(e) =>
                      updateProject(projectID, { batch_size: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 })
                    }
                  />
                </div>
                <div className="c-ml__training-item">
                  <label>Steps per Epochs</label>
                  <InputBase
                    value={data?.steps_per_epochs?.toString() || ""} // Sử dụng giá trị từ props data.steps_per_epochs, nếu không có thì sẽ trống
                    allowClear={false}
                    className="c-ml__input-number"
                    placeholder="input number"
                    type="number"
                    onBlur={(e) =>
                      updateProject(projectID, { steps_per_epochs: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="c-ml__split-right">
            <div className="c-ml__model top">
              <label className="c-ml__label">Dataset versions</label>
              <p className="c-ml__title">
                Model version allows you to specify which prediction will be
                shown to the annotators.
              </p>
              <div className="c-ml__model-select">
                <Select
                  defaultValue={defaultValueDataSet}
                  data={dataset}
                  onChange={(val) => {
                    setDatasetId(val.value);
                  }}
                  className="c-ml__select-model"
                />
                <Button
                  type="hot"
                  className="c-ml--action reset"
                  onClick={() => {
                    addDataset();
                  }}
                  // disabled={masterNodes.length === 0 && workerNodes.length === 0}
                >
                  Choose Version
                </Button>
              </div>
            </div>
            <div className="c-ml__model bottom">
              <div className="c-ml__training-lists">
                <label className="c-ml__label">Set size image</label>
                {isLlmType && (
                  <div className="c-ml__training-item">
                    <label>Sequence token length:</label>
                    <InputBase
                      value={(data?.llm_token ?? "").toString()}
                      allowClear={false}
                      className="c-ml__input-number"
                      placeholder="Enter token length"
                      type="number"
                      onBlur={(e) =>
                        updateProject(projectID, { llm_token: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 })
                      }
                      validateNonNegativeInteger={true}
                    />
                  </div>
                )}
                {isAsrType && <>
                  <div className="c-ml__training-item">
                    <label>Sampling frequency: </label>
                    <InputBase
                      value={(data?.asr_frequency ?? "").toString()}
                      allowClear={false}
                      className="c-ml__input-number"
                      placeholder="Sampling frequency"
                      type="number"
                      onBlur={e =>
                        updateProject(projectID, { asr_frequency: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 })
                      }
                      validateNonNegativeInteger={true}
                    />
                  </div>
                  <Checkbox
                    label="Mono"
                    checked={!!data?.asr_mono}
                    onChange={(value) => updateProject(projectID, { asr_mono: value })}
                    size="sm"
                  />
                  <Checkbox
                    label="Stereo"
                    checked={!data?.asr_mono}
                    onChange={(value) => updateProject(projectID, { asr_mono: !value })}
                    size="sm"
                  />
                </>}
                {isCvType && <>
                  <div className="c-ml__training-item">
                    <label>Image Width</label>
                    <InputBase
                      value={(data?.image_width ?? "").toString()}
                      allowClear={false}
                      className="c-ml__input-number"
                      placeholder="input number"
                      type="number"
                      onBlur={(e) =>
                        updateProject(projectID, { image_width: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 })
                      }
                      validateNonNegativeInteger={true}
                    />
                  </div>
                  <div className="c-ml__training-item">
                    <label>Image Height</label>
                    <InputBase
                      value={(data?.image_height ?? "").toString()}
                      allowClear={false}
                      className="c-ml__input-number"
                      placeholder="input number"
                      type="number"
                      onBlur={(e) =>
                        updateProject(projectID, { image_height: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 })
                      }
                      validateNonNegativeInteger={true}
                    />
                  </div>
                </>}
                {isVideoType && <>
                  <div className="c-ml__training-item">
                    <label>Fps:</label>
                    <InputBase
                      value={(data?.video_fps ?? "").toString()}
                      allowClear={false}
                      className="c-ml__input-number"
                      placeholder="Enter Fps"
                      type="number"
                      onBlur={(e) =>
                        updateProject(projectID, { video_fps: parseInt(e.target.value) ? parseInt(e.target.value) : 1 })
                      }
                      validateNonNegativeInteger={true}
                    />
                  </div>
                  <div className="c-ml__training-item">
                    <label>Resolution: </label>
                    <Select
                      className={"c-ml__training-item__select"}
                      defaultValue={{ label: (data?.video_quality ?? "").toString(), value: (data?.video_quality ?? "").toString() }}
                      data={[
                        {
                          label: "",
                          options: [
                            {
                              label: "320",
                              value: "320",
                            },
                            {
                              label: "1080",
                              value: "1080",
                            },
                          ],
                        },
                      ]}
                      onChange={sv =>
                        updateProject(projectID, { video_quality: parseInt(sv.value) ? parseInt(sv.value) : 1 })
                      }
                    />
                  </div>
                </>}
              </div>
            </div>
          </div>
        </div>
        <Suspense fallback={<AppLoading />}>
          <Modal
            open={isOpenModalModel}
            title="Add Model"
            className="c-ml__add-model"
            onCancel={closeModalModel}
            zIndex={isAdding ? -1 : undefined}
          >
            <BuyModelMarketplaceForm
              validationErrors={validationErrors}
              addModelData={addModelData}
              selectableGpus={selectableGpus}
              addModel={addModel}
              onUpload={onUpload}
              onFieldChange={onFieldChange}
              isloading={gpusLoading}
              data={data}
              gpusListModel={gpusListModel}
              onUpdateModelData={setModelData}
              projectID={projectID}
              onSelectComputes={onSelectComputes}
              selectedGpus={selectedGpus}
              selectedCpus={selectedCpus}
              changedTime={changedTime}
              closeModalModel={closeModalModel}
              confirmSelectComputes={confirmSelectComputes}
              setAddModelData={setAddModelData}
              paramsValue={paramsValue}
              setParamsValue={setParamsValue}
              config={config}
              setConfig={setConfig}
            />
          </Modal>
        </Suspense>
      </div>
      <h4 className="c-ml__last-heading">Training Nodes</h4>
      <div className="c-ml__last">
        {tabs && tabs.length > 0 ?
        <TabContainer
          setCurrentTab={setCurrentNetWorkId}
          key={`key-${tabs}`}
          tabs={tabs}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          showRoutingBtn={false}
          showWorkFlowBtn={false}
        />
        : <span className="c-ml__last-text">No Result</span>}
      </div>
      <LayoutSettings.Footer
        prevUrl={"/projects/" + projectID + `/settings/general`}
        nextUrl={"/projects/" + projectID + `/settings/webhooks`}
        onSkip={() => navigate("/projects/" + projectID + `/settings/webhooks`)}
      />

      <Modal
        displayClose={false}
        open={isOpenModalWaiting}
      >
        Let's take a short break and enjoy some tunes! We're currently preparing your model, which may take up to ... minutes to complete. Thank you for your patience!
      </Modal>
    </div>
  );
};

export default ML;
