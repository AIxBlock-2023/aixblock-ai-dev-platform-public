import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IconArrowRight from "@/assets/icons/IconArrowRight";
import { IconChecked, IconCirclePlus, IconCopyLink, IconHeart } from "@/assets/icons/Index";
import Button from "../../Button/Button";
import { confirmDialog, infoDialog } from "../../Dialog";
import Modal from "../../Modal/Modal";
import { Gpus, useUpdateModelMarketplace } from "@/hooks/settings/ml/useUpdateModelMarketplace";
import { useBooleanLoader } from "@/providers/LoaderProvider";
import "./Index.scss";
import Select, { DataSelect, SelectOption } from "../../Select/Select";
import { useGetListMarketplaceGpus } from "@/hooks/settings/ml/useGetListMarketplaceGpus";
import { useModelMarketplaceLike } from "@/hooks/settings/ml/useModelMarketplaceLike";
import { useModelMarketplaceDownload } from "@/hooks/settings/ml/useModelMarketplaceDownload";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import useGetUser from "@/hooks/admin/user/useGetUser";
import { TMarketplaceGpuModel } from "@/models/marketplaceGpu";
import ModelPreview from "../ModelPreviewNew/Index";
import LineChart from "../../Chart/LineChart";
import { storeInputFields, removeStoreInputFields, IAddModelData } from "@/pages/Project/Settings/ML/ML";
import { useApi } from "@/providers/ApiProvider";
import { formatBytes } from "@/utils/customFormat";
import InputBase from "../../InputBase/InputBase";
import { TProjectModel } from "@/models/project";
import { toastError } from "@/utils/toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useGetModelMarketplaceSell from "@/hooks/modelsSeller/useGetModelMarketplaceSell";
import EmptyContent from "../../EmptyContent/EmptyContent";
import CreateProjectSimple from "../../CreateProjectSimple/CreateProjectSimple";
import { TModelTask } from "@/models/modelMarketplace";
import { useWorkflows } from "@/providers/WorkflowsProvider";
import LoadingPage from "@/components/EmptyContent/LoadingPage";
import { extractErrorMessage } from "@/utils/error";

export interface IModelDataWeight {
  value: string;
  name: string;
  size: number;
  paramasters: number;
  tflops: number;
}

export interface IModelData {
  token_length?: string;
  accuracy: string;
  sampling_frequency: string;
  mono: boolean;
  fps: string;
  resolution: string;
  image_width: string;
  image_height: string;
  framework: string;
  modeltype: string;
  precision: string;
  project: {
    epochs: string;
    batch_size: string;
    batch_size_per_epochs: string;
  };
  calculate_compute_gpu: {
    paramasters: string;
    mac: string;
    gpu_memory: number;
    tflops: number;
    time: number;
    total_cost: string;
    total_power_consumption: number;
  };
  estimate_time: string;
  estimate_cost: string;
  rent_cost: string;
  rent_time: string;
  weights?: IModelDataWeight[];
}

export type TProps = {
  project?: TProjectModel;
  onBackClick: () => void;
  onCompleted: () => void;
  item: any;
  needConfirmResetCompute?: boolean;
  autoCreateProject?: boolean;
}

const Component = ({ item, project, onBackClick, onCompleted, needConfirmResetCompute, autoCreateProject }: TProps) => {
  const weightData = useMemo(() => {
    if (Array.isArray(item.weights) && item.weights.length > 0) {
      return item.weights;
    }

    return [];
  }, [item.weights]);

  const weightOptions: DataSelect["options"] = useMemo(() => {
    if (weightData.length === 0) {
      return [{ label: "(no selectable weight)", value: "" }];
    }

    return weightData.map((weight: IModelDataWeight) => ({
      label: weight.name,
      value: weight.value,
      data: weight,
    }));
  }, [weightData]);

  const modelTasks = useMemo(() => (item?.tasks ?? []).map((t: TModelTask) => t.name), [item?.tasks]);
  const projectID = useMemo(() => project?.id ?? 0, [project?.id]);
  // const isDeploy = useMemo(() => project?.flow_type === "deploy", [project?.flow_type]);
  const [isOpenModalModel, setOpenModalModel] = useState<boolean>(false);
  const { call } = useApi();
  const { onUpdate, onInstall } = useUpdateModelMarketplace();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { gpusListModel, refresh: refreshGpus, loading: loadingGpus } = useGetListMarketplaceGpus(projectID.toString());
  const { isLike, likeCount, likeModel } = useModelMarketplaceLike(item.id);
  const { downloadModel } = useModelMarketplaceDownload(item.id);
  const [selectedGpus, setSelectedGPUs] = useState<Gpus[]>([]);
  const [selectedCpus, setSelectedCpus] = useState<Gpus[] | null>(null);
  const [copiedText, copy] = useCopyToClipboard();
  const { user } = useGetUser({ id: item.owner_id?.toString() });
  // const [paramsValue, setParamsValue] = useState<number | undefined>();
  const [modelData, setModelData] = useState<IModelData>({} as IModelData);
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [changedTime, setChangedTime] = useState<Date>(new Date());
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isOpenModalWaiting, setIsOpenModalWaiting] = useState(false);
  const isFetchComputes = useRef(false);
  const [oldData, setOldData] = React.useState<Gpus[]>([]);
  const [addModelData, setAddModelData] = useState<IAddModelData>({
    name: item.name,
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
    weight: weightOptions.length > 0 ? weightOptions[0].value : null,
  });

  const [modelInfo, setModelInfo] = useState({
    downloadCount: 0,
    modelSize: 0,
    tensorType: 0,
  });

  const createProjectTrigger = useRef<Function | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const actionRentRef = useRef(location.search.includes("action=rent"));
  const { callbackUrl, navigateToCallback } = useWorkflows();
  const [navigating, setNavigating] = useState<boolean>(false);
  const downloadData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      x: i,
      y: 0,
    }));
    if (modelInfo.downloadCount) {
      data[data.length - 1].y = modelInfo.downloadCount;
    }
    return data;
  }, [modelInfo.downloadCount]);

  useBooleanLoader(installing, "Installing model...");

  const closeModalModel = useCallback(() => {
    setOpenModalModel(false);
    isFetchComputes.current = false;
  }, []);

  const selectableGpus = useMemo(() => {
    const results: DataSelect[] = gpusListModel.map((j) => {
      if (Number(j.rental_hours) < Number(modelData.rent_time)) return {
        label: '',
        options: []
      }
      const gpus =
        j.compute_gpus.length > 0
          ? j.compute_gpus.map(
            (c: TMarketplaceGpuModel) =>
            ({
              label: c.gpu_name,
              value: c.id.toString(),
              disabled: j.is_available === false,
              data: {
                compute_id: j.compute_id,
                compute_name: j.compute_name,
                gpu: c,
                isAvailable: j.is_available,
                rental_hours: j.rental_hours,
              },
            } as SelectOption)
          )
          : [
            {
              label: j?.compute_cpu?.cpu,
              value: "compute_gpus",
              disabled: j.is_available === false,
              data: {
                compute_id: j.compute_id,
                compute_name: j.compute_name,
                cpu: j.compute_cpu,
                isAvailable: j.is_available,
                rental_hours: j.rental_hours,
              },
            } as SelectOption,
          ];
      return {
        label: j.compute_name,
        options: gpus,
      };
    }).filter(f => f.options.length);
    return results;
  }, [gpusListModel, modelData.rent_time]);

  const minRentalHoursModel = useMemo(() => {
    let minRentalHours = Infinity;
    gpusListModel.forEach((j) => {
      if (j.rental_hours < minRentalHours) {
        minRentalHours = j.rental_hours;
      }
    });
    return minRentalHours;
  }, [gpusListModel]);

  const onFieldChange = useCallback(
    async (field: string, value: string | File | SelectOption[] | boolean) => {
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

  useEffect(() => {
    const newSelectedGpus = [];
    for (const selectedGpu of selectedGpus) {
      if (Number(selectedGpu.rental_hours) >= Number(modelData.rent_time)) {
        newSelectedGpus.push(selectedGpu);
      }
    }
    setSelectedGPUs(newSelectedGpus);

    const newComputes = [];
    for (const compute of addModelData.computes) {
      if (Number(compute.data.rental_hours) >= Number(modelData.rent_time)) {
        newComputes.push(compute);
      }
    }
    onFieldChange("computes", newComputes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelData.rent_time]);

  const getDataGpus = useCallback((data: Gpus[]) => {
    const cpus = data
      .filter((item) => item.gpus_id === "compute_gpus")
      .map(({ compute_id }) => ({ compute_id }));

    const mergedArray = data
      .filter((item) => item.gpus_id !== "compute_gpus" && Number(item.rental_hours) >= Number(modelData.rent_time))
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

    setSelectedCpus(cpus);
    setSelectedGPUs(mergedArray);
    setChangedTime(new Date())
  }, [setSelectedCpus, setSelectedGPUs, modelData.rent_time]);

  const onSelectGpus = useCallback((result: Gpus[]) => {
    setOldData(result);
  }, []);

  const confirmSelectComputes = useCallback(() => {
    const isVirtualMachines = oldData.some((i) => i?.machine_options === "virtual-machines");
    const virtualList = addModelData.computes.filter((item) => item.data.gpu?.machine_options === "virtual-machines");
    const virtuaSelected = virtualList.map((i) => {
      return i.label;
    }).join(" - ");

    if (isVirtualMachines && needConfirmResetCompute) {
      confirmDialog({
        message: `If you select ${virtuaSelected}, the data will be reset!`,
        onSubmit: () => {
          getDataGpus(oldData);
        },
        onCancel: () => {
          setAddModelData({
            ...addModelData,
            computes: addModelData.computes.filter((i) => i.data.gpu?.machine_options !== "virtual-machines")
          });
          setOldData([]);
          return
        }
      });
    } else {
      getDataGpus(oldData);
    }
  }, [addModelData, getDataGpus, needConfirmResetCompute, oldData]);

  useEffect(() => {
    confirmSelectComputes();
  }, [confirmSelectComputes, oldData]);

  const onSuccess = useCallback((fn: Function | undefined) => {
    if (callbackUrl || fn) {
      setNavigating(true);
      setTimeout(() => {
        setNavigating(false);
        setTimeout(() => {
          if (callbackUrl)
            navigateToCallback();
          else
            fn?.()
        }, 500)
      }, 2000)
    }
  }, [callbackUrl, navigateToCallback, setNavigating]);

  const handleOpenModelRentModal = useCallback(() => {
    // isInit.current = false;
    setOpenModalModel(true)
    isFetchComputes.current = false;
  }, []);

  const buyModel = useCallback(async (pid: number, onNavigate?: Function) => {
    const rentTime = parseInt(modelData.rent_time);

    if (!rentTime || !(rentTime > 0)) {
      toastError("Please specify the desired rental duration in hours.");
      return;
    }

    setInstalling(true);
    setOpenModalModel(false);
    setIsOpenModalWaiting(true)

    try {
      const payloadBase = {
        name: addModelData.name,
        author_id: item?.author_id ?? 1,
        is_buy_least: true,
        project_id: pid,
        gpus: selectedGpus,
        config: {
          token_length: modelData?.token_length,
          accuracy: modelData?.accuracy,
          precision: modelData?.precision,
          sampling_frequency: modelData?.sampling_frequency,
          mono: modelData?.mono,
          fps: modelData?.fps,
          resolution: modelData?.resolution,
          image_width: modelData.image_width,
          image_height: modelData?.image_height,
          framework: modelData?.framework,
        },
        project: {
          epochs: modelData?.project?.epochs,
          batch_size: modelData?.project?.batch_size,
          batch_size_per_epochs: modelData?.project?.batch_size_per_epochs,
        },
        calculate_compute_gpu: {
          paramasters: modelData?.calculate_compute_gpu?.paramasters,
          mac: modelData?.calculate_compute_gpu?.mac,
          gpu_memory: modelData?.calculate_compute_gpu?.gpu_memory,
          tflops: modelData?.calculate_compute_gpu?.tflops,
          total_cost: modelData?.calculate_compute_gpu?.total_cost,
          total_power_consumption:
            modelData?.calculate_compute_gpu?.total_power_consumption,
        },
        estimate_time: modelData?.estimate_time,
        estimate_cost: modelData?.estimate_cost,
        rent_time: modelData?.rent_time,
        rent_cost: modelData?.rent_cost,
        accuracy: modelData?.accuracy,
        weight: addModelData?.weight,
        modeltype: modelData?.modeltype
      };

      const payload = selectedCpus?.length
        ? {
          ...payloadBase,
          cpus: selectedCpus,
        }
        : payloadBase;

      const ar = onUpdate(payload, item.id);
      const res = await ar.promise;

      if (!res.ok) {
        const data = await res.json();
        let errorMessage = "An error occurred while renting model. Please try again!";

        if (data.hasOwnProperty("detail")) {
          errorMessage = "Server error: " + data.detail;
        } else if (Object.hasOwn(data, "messages") && typeof data["messages"] === "object") {
          errorMessage = Object.values(data["messages"]).join(". ");
        }

        handleOpenModelRentModal();
        infoDialog({ message: errorMessage });
        setInstalling(false);
        return;
      }

      downloadModel().promise.finally(() => {
        removeStoreInputFields(projectID);
        setSelectedGPUs([]);
        setSelectedCpus([]);
        onSuccess(onNavigate)
        onCompleted()
      });
    } catch (error) {
      handleOpenModelRentModal();

      if (error instanceof Error) {
        infoDialog({ message: error.message });
      } else {
        infoDialog({
          message: "An error occurred while renting model. Please try again!",
        });
      }
    } finally {
      setIsOpenModalWaiting(false)
    }

    setInstalling(false);
  }, [modelData.rent_time, modelData?.token_length, modelData?.accuracy, modelData?.precision, modelData?.sampling_frequency, modelData?.mono, modelData?.fps, modelData?.resolution, modelData.image_width, modelData?.image_height, modelData?.framework, modelData?.modeltype, modelData?.project?.epochs, modelData?.project?.batch_size, modelData?.project?.batch_size_per_epochs, modelData?.calculate_compute_gpu?.paramasters, modelData?.calculate_compute_gpu?.mac, modelData?.calculate_compute_gpu?.gpu_memory, modelData?.calculate_compute_gpu?.tflops, modelData?.calculate_compute_gpu?.total_cost, modelData?.calculate_compute_gpu?.total_power_consumption, modelData?.estimate_time, modelData?.estimate_cost, modelData?.rent_cost, addModelData.name, addModelData?.weight, item?.author_id, item.id, projectID, selectedGpus, selectedCpus, onUpdate, downloadModel, handleOpenModelRentModal, onCompleted, onSuccess]);

  const installModel = useCallback(async (pid: number, onNavigate?: Function) => {
    setInstalling(true);
    setOpenModalModel(false);

    try {
      const payloadBase = {
        author_id: item?.author_id ?? 1,
        is_buy_least: true,
        project_id: pid,
        gpus: selectedGpus,
      };

      const payload = selectedCpus?.length ? { ...payloadBase, cpus: selectedCpus } : payloadBase;

      const ar = onInstall(payload, item.id);
      const res = await ar.promise;

      if (!res.ok) {
        const data = await res.json();
        let errorMessage = "An error occurred while installing model. Please try again!";

        if (data.hasOwnProperty("detail")) {
          errorMessage = "Server error: " + data.detail;
        } else if (Object.hasOwn(data, "messages") && typeof data["messages"] === "object") {
          errorMessage = Object.values(data["messages"]).join(". ");
        }

        handleOpenModelRentModal();
        infoDialog({ message: errorMessage });
        setInstalling(false);
        return;
      }

      downloadModel().promise.finally(() => {
        removeStoreInputFields(projectID);
        setSelectedGPUs([]);
        setSelectedCpus([]);
        onSuccess(onNavigate)
        onCompleted();
      });
    } catch (error) {
      handleOpenModelRentModal();

      if (error instanceof Error) {
        infoDialog({ message: error.message });
      } else {
        infoDialog({
          message: "An error occurred while renting model. Please try again!",
        });
      }
    }

    setInstalling(false);
  }, [downloadModel, handleOpenModelRentModal, item?.author_id, item.id, onCompleted, onInstall, projectID, selectedCpus, selectedGpus, onSuccess]);

  // const handleParamsChange = useCallback((v: number) => {
  //   setParamsValue(v);
  //   isFetchComputes.current = true;
  //   storeInputFields({ projectID, paramsValue: parseInt(event.target.value) })
  // }, []);

  const computeIds = useMemo(() => selectedGpus.filter(item => !!item.compute_id).map((item) => item.compute_id.toString()), [selectedGpus]);

  const gpusIds = useMemo(() => selectedGpus.map((item) => ({
    id: item.compute_id,
    val: (item.gpus_id as string).split(","),
  })), [selectedGpus]);

  const computeGpus = useMemo(() => gpusListModel.filter(
    (item) => item.compute_gpus.length > 0
  ), [gpusListModel]);

  const gpusList = useMemo(() => computeGpus.filter((item) =>
    computeIds.includes(item.compute_id.toString())
  ), [computeGpus, computeIds]);

  // const cpuList = useMemo(() => gpusListModel.filter(
  //   (item) => item?.compute_cpu && Object.keys(item?.compute_cpu).length > 0
  // ), [gpusListModel]);

  const cpuIds = useMemo(() => selectedCpus?.map((item) => ({
    id: item.compute_id,
  })), [selectedCpus]);

  const gpusFilter = useMemo(() => gpusIds.map((item2) => {
    const correspondingItem1 = gpusList.find(
      (item1) => item1.compute_id === item2.id
    );
    if (correspondingItem1) {
      const filteredComputeGpus = correspondingItem1.compute_gpus.filter(
        (gpu) => item2.val.includes(gpu.id.toString())
      );
      return {
        compute_gpus: filteredComputeGpus,
      };
    }
    return null;
  }), [gpusIds, gpusList]);

  // const cpuFilters = useMemo(() => cpuIds?.map((item2) => {
  //   return cpuList.find((item1) => item1.compute_id === item2.id)?.compute_cpu;
  // }), [cpuIds, cpuList]);
  //
  // useEffect(() => {
  //   const currentInputs = getStoreInputFields(projectID);
  //   if (currentInputs && isInit.current && selectableGpus.length > 0) {
  //     isInit.current = true;
  //     const { computes, paramsValue } = currentInputs;
  //     if (paramsValue) {
  //       setParamsValue(paramsValue);
  //     }
  //     const parsedSelectableGpus = selectableGpus.flatMap((o) => o.options);
  //     const gpusCached = (computes ?? []).filter((o: any) =>
  //       parsedSelectableGpus.some((item) => item.value === o.value)
  //     );
  //     setAddModelData({ computes: gpusCached } as IAddModelData);
  //     const availableGpus = gpusCached.map((o: any) => ({
  //       compute_id: o.data.compute_id,
  //       gpus_id: o.value,
  //     }));
  //     onSelectGpus(availableGpus);
  //   }
  // }, [onSelectGpus, projectID, isOpenModalModel, selectableGpus]);

  const [, setLoading] = React.useState(true);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [, setError] = React.useState<string | null>(null);
  // Check demo and stats
  useEffect(() => {
    const backendURL = "https://127.0.0.1:9090";
    const projectID = 1;
    const controller = new AbortController();

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: projectID.toString(),
      }),
      signal: controller.signal,
    };

    let url = backendURL;

    while (url.endsWith("/")) {
      url = url.substring(0, url.length - 2);
    }

    fetch(backendURL + "/model_trial", requestOptions)
      .then(r => r.json())
      .then(r => {
        if (controller.signal.aborted || !Object.hasOwn(r, "share_url")) {
          return;
        }

        setPreviewUrl(r.share_url);
      })
      .catch(e => {
        if (Object.hasOwn(e, "message")) {
          setError(e.message);
        } else {
          setError("An error has been occurred while loading model information.");
        }
      })
      .finally(() => {
        if (controller.signal.aborted) {
          return;
        }

        setLoading(false);
      });


    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams({
          project_id: projectID.toString(),
        });
        const ar = call("downloadModelData", {
          params: { pk: item.id },
          query: queryParams,
        });
        const response = await ar.promise;
        const data = await response.json();

        setModelInfo({
          downloadCount: data.download_count,
          modelSize: data.model_size,
          tensorType: data.tensor_type,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, call]);

  // After component mounted, check installable status of model.
  useEffect(() => {
    setInstallable(false);
    setCheckingAvailability(true);
    const ar = call("modelMarketplaceAivailable", { params: { id: item.id } });

    ar.promise
      .then(r => r.json())
      .then(r => {
        if (typeof r !== "object") {
          return;
        }
        setInstallable(!r.is_rent_model);
      })
      .catch(e => {
        if (window.APP_SETTINGS.debug) {
          console.error(e);
        }
      })
      .finally(() => {
        if (ar.controller.signal.aborted) {
          return;
        }

        setCheckingAvailability(false);
      });

    return () => {
      ar.controller.abort("Component unmounted");
    }
  }, [call, item]);

  const createProject = async () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const title = `Project ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
                now.getHours(),
            )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const projectBody = {
          title,
          color: '#a2a2a2',
          label_config: '<View>\n  <Header value="Please read the text" />\n  </View>\n\n\n',
          label_config_title: '',
          annotation_template: null,
          template_id: 24,
          type: {},
          epochs: 1,
          batch_size: 1,
          image_width: 64,
          image_height: 64,
          flow_type: modelData.modeltype === 'training' ? 'fine-tune-and-deploy' : 'deploy',
      };
      
      const ar = call('createProjects', {
          body: projectBody,
      });
  
      try {
        const res = await ar.promise;

        if (res.ok) {
          const project = await res.json();
          return project;
        }
      } catch (e) {
        toastError(extractErrorMessage(e));
      }
  };

  const onSubmit = async () => {
    if (autoCreateProject) {
      const project = await createProject();
      if (project) {
        const run = installable ? installModel : buyModel;
        await run(project.id);
        // goToProject(project);
        return;
      }
    } else {
      if (projectID) {
        installable ? installModel(projectID) : buyModel(projectID);
        return;
      }

      setShowCreateProject(true);
    }
  };

  useEffect(() => {
    if (!actionRentRef.current) {
      return;
    }

    handleOpenModelRentModal()
  }, [handleOpenModelRentModal]);
  const goToProject = (project: TProjectModel) => {
    switch (project.flow_type) {
      case "deploy":
        navigate(`/${project.flow_type}/${project.id}/demo-and-deploy`);
        break;
      case "label-and-validate-data":
        navigate(`/${project.flow_type}/${project.id}/setup-infrastructure/storage`);
        break;
      case "train-and-deploy":
        navigate(`/${project.flow_type}/${project.id}/setup-infrastructure/storage`);
        break;
      case "fine-tune-and-deploy":
        navigate(`/${project.flow_type}/${project.id}/setup-infrastructure/storage`);
        break;
    }
  };
  const isSupportDDP = useMemo(() => {
    try {
      const cfg = JSON.parse(item.config ?? "{}");
      return !!cfg.is_support_ddp;
    } catch {
    }

    return false;
  }, [item.config]);

  return (
    <div className="p-model-detail">
      <div className="p-model-detail__header">
        <div className="p-model-detail__header-left">
          <div className="p-model-detail__header-left-top">
            <div className="p-model-detail__breadcrumb">
              <ul>
                <li className="p-model-detail__breadcrumb-item">
                  {user?.username}
                </li>
                <li className="p-model-detail__breadcrumb-item last">
                  {item.id + "-" + item.name.normalize("NFKC").replaceAll(" ", "-")}
                </li>
              </ul>
            </div>
            {isSupportDDP && <div><strong>DDP</strong></div>}
            <button
              className="p-model-detail__copy-link"
              onClick={() => {
                copy?.(
                  (user?.username ?? item.author_id) + "/"
                  + item.id + "-" + item.name.normalize("NFKC").replaceAll(" ", "-")
                );
              }}
            >
              {copiedText ? <IconChecked color="#27BE69" /> : <IconCopyLink />}
            </button>
            <div className="p-model-detail__like-box">
              <div
                className="p-model-detail__like-box-left"
                onClick={likeModel}
              >
                <IconHeart isLike={isLike} />
                {isLike ? "Unlike" : "Like"}
              </div>
              <div className="p-model-detail__like-box-right">{likeCount}</div>
            </div>
          </div>
          <div className="p-model-detail__header-left-bottom">
            <div className="p-model-detail__tags">
              {item?.tags?.map((item: string, index: number) => (
                <div key={`key-${index}`} className="p-model-detail__tag">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-model-detail__header-right">
          {weightData.length > 0 && (
            <Select
              data={[{ options: weightOptions }]}
              defaultValue={weightOptions[0]}
              onChange={o => onFieldChange("weight", o.data)}
              className="p-model-detail__weight-select"
            />
          )}
          {
            installable
              ? (
                <Button
                  className="p-model-detail__icon buy"
                  icon={<IconCirclePlus />}
                  onClick={() => handleOpenModelRentModal()}
                  disabled={checkingAvailability}
                >
                  Install Model
                </Button>
              ) : (
                <Button
                  className="p-model-detail__icon buy"
                  icon={<IconCirclePlus />}
                  onClick={() => handleOpenModelRentModal()}
                  disabled={checkingAvailability}
                >
                  Rent Model
                </Button>
              )
          }
          <Button
            className="p-model-detail__icon back"
            icon={<IconArrowRight width={16} height={16} style={{ transform: "rotateZ(180deg)" }} />}
            iconPosition="left"
            onClick={onBackClick}
          >
            Back
          </Button>
        </div>
      </div>
      <div className="p-model-detail__wrapper">
        <div className="p-model-detail__content">
          {item.name && (
            <h4 className="p-model-detail__content-name">{item.name}</h4>
          )}
          <div className="p-model-detail__content-price">
            <span>Price: </span>
            <span>{item.price}</span>
          </div>
          <div
            className="p-model-detail__content-desc"
            dangerouslySetInnerHTML={{ __html: item?.model_desc }}
          />
          {item.file && (
            <div className="p-model-detail__demo-img">
              <img src={item.file} alt="demo_img" />
            </div>
          )}
        </div>
        <div className="p-model-detail__content-right">
          <div className="p-model-detail__content-right__row">
            <div className="p-model-detail__content-right__title">
              Downloads last month
              <span>{modelInfo.downloadCount ?? 0}</span>
            </div>
            <div className="p-model-detail__content-right__chart">
              <LineChart
                data={downloadData}
                svgWidth={200}
                svgHeight={40}
              />
            </div>
          </div>
          <div
            className="p-model-detail__content-right__row"
            style={{ justifyContent: "flex-start" }}
          >
            <div className="p-model-detail__params-tag">
              <span className="first">Model size</span>
              <span>{modelInfo.modelSize ?? 'NA'} params</span>
            </div>
            <div className="p-model-detail__params-tag">
              <span className="first">Tensor type</span>
              <span>{modelInfo.tensorType ?? 'NA'}</span>
            </div>
          </div>
          <div className="p-model-detail__chatbox p-model-detail__chatbox--iframe">
            {previewUrl && (
              <iframe
                title="Model demo"
                allow="camera;microphone"
                src={previewUrl}
                style={{ border: 0 }}
                onLoad={(ev) => {
                  if (!ev.currentTarget.contentWindow) {
                    return;
                  }

                  try {
                    ev.currentTarget.style.height = ev.currentTarget.contentWindow.document.documentElement.scrollHeight + 'px';
                  } catch (e) {
                    ev.currentTarget.style.height = "calc(100vh - 336px)";

                    if (window.APP_SETTINGS.debug) {
                      console.error(e);
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      <Modal
        open={isOpenModalModel}
        title={installable ? "Install Model" : "Rent Model"}
        className="p-model-detail__modal-buy"
        onCancel={closeModalModel}
        cancelText="Cancel"
        onSubmit={onSubmit}
        submitText={installable ? "Install" : "Rent"}
        disableSubmit={disableSubmit || checkingAvailability}
      >
        <div className={"c-model-preview__group"}>
          <div className={"c-model-preview__row justify"}>
            <div className={"c-model-preview__input-column"}>
              <div className="c-model-preview__item__label">
                <label>Title</label>
                <span className="required">*</span>
              </div>
              <InputBase
                allowClear={false}
                className="percents__item__input-number"
                onChange={(e) => {
                  onFieldChange("name", e.target.value);
                }}
                value={item.name ?? ""}
              />
            </div>
          </div>
        </div>
        <ModelPreview
          showEstimateCost={!installable}
          detail={project}
          // paramsValue={paramsValue}
          // handleParamsChange={handleParamsChange}
          gpusFilter={gpusFilter as any}
          // cpuFilters={cpuFilters as any}
          model={item}
          onUpdateModelData={setModelData}
          setDisableSubmit={setDisableSubmit}
          projectID={projectID}
          cpuIds={cpuIds?.map((ids) => ids.id) || []}
          lastChanged={changedTime}
          // setOpenModalModel={setOpenModalModel}
          isFetchComputes={isFetchComputes}
          modelPreviewType="RENT-MODEL"
          installable={installable}
          minRentalHoursModel={minRentalHoursModel}
        >
          <div className="c-model-preview__input-column">
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div className="c-model-preview__item__label">
                <label>Select Computes</label>
                <span className="required">*</span>
              </div>
              <div style={{
                display: "flex",
                gap: 16,
              }}>
                <span
                  onClick={() => {
                    localStorage.setItem("computes-return", JSON.stringify({ name: "Model: " + item.name, url: location.pathname + "?action=rent" }));
                    navigate("/infrastructure/setup-gpu/self-host");
                  }}
                  style={{
                    cursor: "pointer",
                    color: "#4949e8",
                    fontWeight: 700,
                    fontSize: "0.9em",
                  }}
                >
                  Add my compute
                </span>
                <span
                  onClick={() => {
                    localStorage.setItem("computes-return", JSON.stringify({ name: "Model: " + item.name, url: location.pathname + "?action=rent" }));
                    navigate("/marketplace/computes");
                  }}
                  style={{
                    cursor: "pointer",
                    color: "#4949e8",
                    fontWeight: 700,
                    fontSize: "0.9em",
                  }}
                >
                  Rent compute
                </span>
                {!loadingGpus && (
                  <span onClick={refreshGpus} style={{
                    cursor: "pointer",
                    color: "#4949e8",
                    fontWeight: 700,
                    fontSize: "0.9em",
                  }}>
                    Refresh
                  </span>
                )}
                {loadingGpus && (
                  <span>Loading Computes List...</span>
                )}
              </div>
            </div>
            <Select
              data={selectableGpus}
              className="c-ml__select-model"
              isMultiple={true}
              type="checkbox"
              onMultipleChange={(opts) => {
                onFieldChange("computes", opts);
                onSelectGpus(
                  opts
                    .filter(o => o.data?.isAvailable !== false)
                    .map((o) => ({
                      compute_id: o.data.compute_id,
                      gpus_id: o.value,
                      machine_options: o.data.gpu?.machine_options,
                      rental_hours: o.data.rental_hours,
                    }))
                )
                isFetchComputes.current = true;
                storeInputFields({ projectID, computes: opts })
              }}

              placeholderText={
                selectableGpus.length === 0 ? "No computes are available" : "Please select a compute"
              }
              defaultValue={addModelData.computes}
              customRenderLabel={(item) => {
                return <div className="c-ml__select-model--select-item"
                  style={{ opacity: item.data?.isAvailable === false ? 0.3 : 1 }}>
                  {item.data.cpu ? <>
                    <span>{item.data.cpu.cpu}</span>
                    <span>Ram: {formatBytes(item.data?.cpu?.ram ?? 0)}</span>
                    <span>Disk: {formatBytes(item.data?.cpu?.disk ?? 0)} {item.data?.cpu?.diskType ?? ""}</span>
                  </> : <>
                    <span>{item.data.gpu.gpu_name}{item.data.compute_name ? " / " + item.data.compute_name : ""}</span>
                    {item.data?.gpu?.gpu_memory && (
                      <span>vRam: {formatBytes(item.data?.gpu?.gpu_memory ?? 0) ?? ""}</span>)}
                  </>}
                  {item.data?.isAvailable === false && <span>(Incompatible)</span>}
                </div>
              }}
            />
          </div>
        </ModelPreview>
      </Modal>

      <Modal
        open={isOpenModalWaiting}
        displayClose={false}
      >
        Let's take a short break and enjoy some tunes! We're currently preparing your model, which may take up to ...
        minutes to complete. Thank you for your patience!
      </Modal>

      <Modal
        title="New Project"
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        closeOnOverlayClick={false}
        submitText="Create Project"
        onSubmit={() => createProjectTrigger.current?.()}
      >
        <CreateProjectSimple
          onCreated={(project: TProjectModel) => {
            installable ? installModel(project.id, () => goToProject(project)) : buyModel(project.id, () => goToProject(project));
          }}
          registerTrigger={cb => createProjectTrigger.current = cb}
          limitTasks={modelTasks}
        />
      </Modal>
      {navigating && <LoadingPage message="Loading page..."></LoadingPage>}
    </div>
  );
};

export default function ModelDetail({ project, onBackClick, onCompleted, autoCreateProject }: Omit<TProps, "item">) {
  const { modelId } = useParams();
  const data = useGetModelMarketplaceSell(modelId);

  if (data.loading || !data.detail) {
    return <EmptyContent message="Loading model information..." />;
  }

  if (data.detail?.model_type !== "rent_marketplace") {
    return <EmptyContent
      message="This model is not listed in the marketplace."
      buttons={[
        { children: "Back", onClick: () => onBackClick() }
      ]}
    />;
  }

  return <Component project={project} onBackClick={onBackClick} onCompleted={onCompleted} item={data.detail} autoCreateProject={autoCreateProject} />;
}
