import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import IconArrowRight from "@/assets/icons/IconArrowRight";
import {
  IconChecked,
  IconCirclePlus,
  IconCopyLink,
  IconHeart,
} from "@/assets/icons/Index";
import Button from "@/components/Button/Button";
import { confirmDialog, infoDialog } from "@/components/Dialog";
import Modal from "@/components/Modal/Modal";
import {
  Gpus,
  useUpdateModelMarketplace,
} from "@/hooks/settings/ml/useUpdateModelMarketplace";
import { useBooleanLoader } from "@/providers/LoaderProvider";
import "./Index.scss";
import Select, {
  DataSelect,
  SelectOption,
} from "@/components/Select/Select";
import { useGetListMarketplaceGpus } from "@/hooks/settings/ml/useGetListMarketplaceGpus";
import { useModelMarketplaceLike } from "@/hooks/settings/ml/useModelMarketplaceLike";
import { useModelMarketplaceDownload } from "@/hooks/settings/ml/useModelMarketplaceDownload";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import useGetUser from "@/hooks/admin/user/useGetUser";
import { TMarketplaceGpuModel } from "@/models/marketplaceGpu";
import useProjectHook from "@/hooks/project/useProjectHook";
import ModelPreview from "../ModelPreviewNew/Index";
import LineChart from "@/components/Chart/LineChart";
import { storeInputFields, getStoreInputFields, removeStoreInputFields, IAddModelData } from "../ML";
import { useApi } from "@/providers/ApiProvider";
import { formatBytes } from "@/utils/customFormat";
import AppLoading from "@/components/AppLoading/AppLoading";
import InputBase from "@/components/InputBase/InputBase";

export interface IProject {
  epochs: string;
  batch_size: string;
  batch_size_per_epochs: string;
}

export interface ICalculateComputeGpu {
  paramasters: string;
  mac: string;
  gpu_memory: number;
  tflops: number;
  time: number;
  total_cost: string;
  total_power_consumption: number;
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
  precision: string;
  project: IProject;
  calculate_compute_gpu: ICalculateComputeGpu;
  estimate_time: string;
  estimate_cost: string;
  rent_cost: string;
  rent_time: string;
  modeltype: string;
}

const ModelDetail = () => {
  const [isOpenModalModel, setOpenModalModel] = useState<boolean>(false);
  const location = useLocation();
  const { item } = location.state || {};
  const adddModelDataDefault = {
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
  }
  const params = useParams();
  const projectID = parseInt(params.projectID ?? "0");
  const { call } = useApi();
  const { detail } = useProjectHook(Number(projectID));
  const navigate = useNavigate();
  const { onUpdate, onInstall } = useUpdateModelMarketplace();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { gpusListModel, loading: gpusLoading } = useGetListMarketplaceGpus(
    projectID.toString()
  );
  const { isLike, likeCount, likeModel } = useModelMarketplaceLike(item.id);
  const { downloadModel } = useModelMarketplaceDownload(item.id);
  const [selectedGpus, setSelectedGPUs] = useState<Gpus[]>([]);
  const [selectedCpus, setSelectedCpus] = useState<Gpus[] | null>(null);
  const [copiedText, copy] = useCopyToClipboard();
  const { user } = useGetUser({ id: item.owner_id?.toString() });
  const [paramsValue, setParamsValue] = useState<number | undefined>();
  const [modelData, setModelData] = useState<IModelData>({} as IModelData);
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [changedTime, setChangedTime] = useState<Date>(new Date());
  const [addModelData, setAddModelData] = useState<IAddModelData>(adddModelDataDefault);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isOpenModalWaiting, setIsOpenModalWaiting] = useState(false);
  const isFetchComputes = useRef(false);
  const [oldData, setOldData] = React.useState<Gpus[]>([]);

  const [modelInfo, setModelInfo] = useState({
    downloadCount: 0,
    modelSize: 0,
    tensorType: 0,
  });

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

  // const [isInit, setIsInit] = useState(false);
  const isInit = useRef<boolean>(false)

  useBooleanLoader(installing, "Installing model...");

  const closeModalModel = () => {
    setOpenModalModel(false);
    isFetchComputes.current = false;
  };
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

    setSelectedCpus(cpus);
    setSelectedGPUs(mergedArray);
    setChangedTime(new Date())
  }, [setSelectedCpus, setSelectedGPUs]);

  const onSelectGpus = useCallback((result: Gpus[]) => {
    setOldData(result);
  }, []);

  const confirmSelectComputes = () => {
    const isVirtualMachines = oldData.some((i) => i?.machine_options === "virtual-machines");
    const virtualList = addModelData.computes.filter((item) => item.data.gpu?.machine_options === "virtual-machines");
    const virtuaSelected = virtualList.map((i) => {
      return i.label;
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
            computes: addModelData.computes.filter((i) => i.data.gpu?.machine_options !== "virtual-machines")
          });
          setOldData([]);
          return
        }
      });
    } else {
      getDataGpus(oldData);
    }
  }

  const handleOpenModelRentModal = () => {
    // isInit.current = false;
    setOpenModalModel(true)
    isFetchComputes.current = false;
  }

  const buyModel = async () => {
    setInstalling(true);
    setOpenModalModel(false);
    setIsOpenModalWaiting(true)

    try {
      const payloadBase = {
        name: addModelData.name,
        author_id: item?.author_id ?? 1,
        is_buy_least: true,
        project_id: projectID,
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
        navigate("/projects/" + projectID + "/settings/ml");
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
  };

  const installModel = useCallback(async () => {
    setInstalling(true);
    setOpenModalModel(false);

    try {
      const payloadBase = {
        author_id: item?.author_id ?? 1,
        is_buy_least: true,
        project_id: projectID,
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
        navigate("/projects/" + projectID + "/settings/ml");
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
  }, [downloadModel, item?.author_id, item.id, navigate, onInstall, projectID, selectedCpus, selectedGpus]);

  const handleParamsChange = (v: number) => {
    setParamsValue(v);
    isFetchComputes.current = true;
    // storeInputFields({ projectID, paramsValue: parseInt(event.target.value) })
  };

  const computeIds = selectedGpus.filter(item => !!item.compute_id).map((item) => item.compute_id.toString());
  const gpusIds = selectedGpus.map((item) => ({
    id: item.compute_id,
    val: (item.gpus_id as string).split(","),
  }));

  const computeGpus = gpusListModel.filter(
    (item) => item.compute_gpus.length > 0
  );

  const gpusList = computeGpus.filter((item) =>
    computeIds.includes(item.compute_id.toString())
  );

  const cpuList = gpusListModel.filter(
    (item) => item?.compute_cpu && Object.keys(item?.compute_cpu).length > 0
  );

  const cpuIds = selectedCpus?.map((item) => ({
    id: item.compute_id,
  }));

  const gpusFilter = gpusIds.map((item2) => {
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
  });

  const cpuFilters = cpuIds?.map((item2) => {
    return cpuList.find((item1) => item1.compute_id === item2.id)?.compute_cpu;
  });

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

  const [loading, setLoading] = React.useState(true);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
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

  return (
    <div className="p-model-detail">
      <div className="p-model-detail__header">
        <div className="p-model-detail__header-left">
          <div className="p-model-detail__header-left-top">
            <div className="p-model-detail__breadcrumb">
              <ul>
                <li
                  className="p-model-detail__breadcrumb-item"
                  onClick={() =>
                    navigate(`/marketplace/models/${item.author_id}`)
                  }
                >
                  {user?.username}
                </li>
                <li className="p-model-detail__breadcrumb-item last">
                  {item.id + "-" + item.name.normalize("NFKC").replaceAll(" ", "-")}
                </li>
              </ul>
            </div>
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
            icon={<IconArrowRight width={16} height={16} />}
            onClick={() => navigate("/marketplace/models/" + projectID)}
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

      <Suspense fallback={<AppLoading />}>
        <Modal
          open={isOpenModalModel}
          title={installable ? "Install Model" : "Rent Model"}
          className="p-model-detail__modal-buy"
          onCancel={closeModalModel}
          cancelText="Cancel"
          onSubmit={installable ? installModel : buyModel}
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
            detail={detail}
            paramsValue={paramsValue}
            handleParamsChange={handleParamsChange}
            gpusFilter={gpusFilter as any}
            cpuFilters={cpuFilters as any}
            model={item}
            onUpdateModelData={setModelData}
            setDisableSubmit={setDisableSubmit}
            projectID={projectID}
            cpuIds={cpuIds?.map((ids) => ids.id) || []}
            lastChanged={changedTime}
            setOpenModalModel={setOpenModalModel}
            isFetchComputes={isFetchComputes}
            modelPreviewType="RENT-MODEL"
          >
            <div className="c-model-preview__input-column">
              <div className="c-model-preview__item__label">
                <label>Select Computes</label>
                <span className="required">*</span>
              </div>
              <Select
                data={selectableGpus}
                className="c-ml__select-model"
                isMultiple={true}
                type="checkbox"
                onMultipleChange={(opts) => {
                  onFieldChange("computes", opts);
                  onSelectGpus(
                    opts.map((o) => ({ compute_id: o.data.compute_id, gpus_id: o.value, machine_options: o.data.gpu?.machine_options }))
                  )
                  isFetchComputes.current = true;
                  storeInputFields({ projectID, computes: opts })
                }}
                // isLoading={gpusLoading}
                // isSelectGroup
                placeholderText={
                  selectableGpus.length === 0 ? "No computes are available" : "Please select a compute"
                }
                defaultValue={addModelData.computes}
                customRenderLabel={(item) => {
                  return <div className="c-ml__select-model--select-item">
                    {item.data.cpu ? <>
                      <span>{item.data.cpu.cpu}</span>
                      <span>Ram: {formatBytes(item.data?.cpu?.ram ?? 0)}</span>
                      <span>Disk: {formatBytes(item.data?.cpu?.disk ?? 0)} {item.data?.cpu?.diskType ?? ""}</span>
                    </> : <>
                      <span>{item.data.gpu.gpu_name}</span>
                      {item.data?.gpu?.gpu_memory && (<span>vRam: {formatBytes(item.data?.gpu?.gpu_memory ?? 0) ?? ""}</span>)}
                    </>}
                  </div>
                }}
                onClickOutside={confirmSelectComputes}
              />
            </div>
          </ModelPreview>
        </Modal>
      </Suspense>

      <Modal
        open={isOpenModalWaiting}
        displayClose={false}
      >
        Let's take a short break and enjoy some tunes! We're currently preparing your model, which may take up to ... minutes to complete. Thank you for your patience!
      </Modal>
    </div>
  );
};

export default ModelDetail;
