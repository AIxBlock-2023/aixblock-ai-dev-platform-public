import React, { ChangeEvent, Dispatch, MutableRefObject, ReactNode, SetStateAction, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import IconError from "@/assets/icons/IconError";
// import IconLoading from "@/assets/icons/IconLoading";
// import Checkbox from "@/components/Checkbox/Checkbox";
import InputBase from "../../InputBase/InputBase";
import Modal from "../../Modal/Modal";
import Select, {
  SelectOption,
} from "../../Select/Select";
// import useGetAnnotationTemplateDetail from "@/hooks/annotation/useAnnotationDetailTemplate";
import { TProjectModel } from "@/models/project";
import { useApi } from "@/providers/ApiProvider";
import {convertFLOP, formatFloat, formatGpuMem} from "@/utils/customFormat";
import InputRender from "../InputRender/Index";
import { IAddModelData, storeInputFields } from "@/pages/Project/Settings/ML/ML";
import "./Index.scss";
import { Checkpoint, ModelSource } from "@/pages/Project/Settings/ML/helper";
import FormConfig from "../../ManageConnect/FormConfig/Index";
import IconPlusSquare from "@/assets/icons/IconPlusSquare";
import { CONFIG_TYPE, Config } from "../../ManageConnect/ManageConnect";
import { infoDialog } from "../../Dialog";
import {dataFramework, dataModelType} from "@/pages/Flow/constants/Index";

type TGPU = {
  id: number;
  gpu_name: string;
  power_consumption: number | null;
  memory_usage: number | null;
  gpu_index: number;
  gpu_id: string;
  branch_name: string;
};

type TGPUList = {
  compute_gpus: TGPU[];
};

// type TCPU = {
//   name: string;
//   cpu: string;
//   ram: number;
//   storage: number;
//   diskType: string;
//   os: string;
//   serial_number: string;
//   ip: string;
// };

interface IModelPreviewProps {
  detail: TProjectModel | null | undefined;
  // paramsValue?: number | undefined;
  // handleParamsChange?: (v: number) => void;
  // cpuFilters?: TCPU[];
  gpusFilter?: TGPUList[];
  model?: any;
  onUpdateModelData?: (data: any) => void;
  showEstimateCost: boolean;
  setDisableSubmit: Dispatch<React.SetStateAction<boolean>>;
  projectID: number;
  cpuIds?: number[];
  lastChanged?: Date;
  // setOpenModalModel?: Dispatch<React.SetStateAction<boolean>>;
  isFetchComputes?: MutableRefObject<boolean>;
  children?: ReactNode;
  onFieldChange?: (field: string, value: string | SelectOption[] | number | boolean | File) => void;
  modelPreviewType: "ADD-MODEL" | "RENT-MODEL";
  addModelData?: IAddModelData;
  setAddModelData?: Dispatch<SetStateAction<IAddModelData>>;
  setIsInValidModelSource?: Dispatch<SetStateAction<boolean>>;
  setIsInValidCheckpoint?: Dispatch<SetStateAction<boolean>>;
  config?: {
    [key: string]: Config;
  },
  setConfig?: Dispatch<React.SetStateAction<{
    [key: string]: Config;
  }>>,
  installable?: boolean;
  minRentalHoursModel: number;
}

export type TCalculateComputeGpuResponse = {
  paramasters: string;
  mac: string;
  gpu_memory: number;
  tflops: number;
  time: number;
  total_cost: number;
  total_power_consumption: number;
  token_symbol: string
};

const ModelPreview = (props: IModelPreviewProps) => {
  const api = useApi();
  const {
    detail,
    // paramsValue,
    // handleParamsChange,
    // cpuFilters,
    gpusFilter,
    model,
    onUpdateModelData,
    showEstimateCost,
    setDisableSubmit,
    projectID,
    // cpuIds,
    // lastChanged
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // setOpenModalModel = () => { },
    isFetchComputes,
    onFieldChange,
    modelPreviewType,
    addModelData,
    setAddModelData,
    setIsInValidModelSource,
    setIsInValidCheckpoint,
    config,
    setConfig,
    minRentalHoursModel,
  } = props;

  let modelConfig = null;

  try {
    modelConfig = model ? JSON.parse(model?.config) : null;
  } catch (e) {
  }

  // const { annotation } = useGetAnnotationTemplateDetail(detail?.template_id?.toString());
  const [, setIsLoading] = React.useState<boolean>(false);
  const [calculateComputeGpu, setCalculateComputeGpu] = useState<TCalculateComputeGpuResponse>();
  // const [samplingFrequency, setSamplingFrequency] = useState<string>(modelConfig?.sampling_frequency?.toString() || "48000");
  // const [fps, setFps] = useState<string>(modelConfig?.fps?.toString() || "");
  // const [token, setToken] = useState<string>(model?.config?.token_length?.toString() || "4096");
  // const [mono, setMono] = useState<boolean>(true);
  // const [imageSize, setImageSize] = useState<{ width: string; height: string }>({
  //   width: modelConfig?.image_width?.toString() || "213",
  //   height: modelConfig?.image_height?.toString() || "213",
  // });
  // const [resolution, setResolution] = useState<string>(modelConfig?.resolution?.toString() || "320");
  const [framework, setFramework] = useState<string>(modelConfig?.framework?.toString() || "huggingface");

  const isDeploy = detail?.flow_type === "deploy";
  // const isDeploy = detail?.flow_type === "deploy";
  const [modeltype, setModelType] = useState<string>(
    modelConfig?.modeltype?.toString() || (!isDeploy ? "inference" : "training")
  );
  // console.log(detail?.flow_type, isDeploy, modeltype)

  // const [accuracy, setAccuracy] = useState<string>(modelConfig?.accuracy?.toString() || "70");
  // const [precision, setPrecision] = useState<"FP16" | "BF16" | null>(modelConfig?.precision?.toString() || "FP16");
  const [estimateTime, setEstimateTime] = useState<string>(() => {
    if (calculateComputeGpu?.time) {
      const timeNumber = Number(calculateComputeGpu.time);
      return timeNumber.toFixed(0);
    }
    return '0';
  });
  
  const [estimateCost, setEstimateCost] = useState<string>(calculateComputeGpu?.total_cost?.toString() || '0');
  const [rentTime, setRentTime] = useState<string>(minRentalHoursModel.toString());
  const [rentCost, setRentCost] = useState<string>(estimateCost);
  // const [epochs, setEpochs] = useState<string>(detail?.epochs?.toString() || "10");
  // const [batchSize, setBatchSize] = useState<string>(detail?.batch_size?.toString() || "10");
  // const [batchSizePerEpochs, setBatchSizePerEpochs] = useState<string>(
  //   detail?.epochs?.toString() && detail?.batch_size?.toString()
  //     ? Math.round(detail?.batch_size / detail?.epochs).toString()
  //     : "2"
  // );
  const [isOpenModalConfirm, setIsOpenModalConfirm] = useState(false);
  const [modelSourceType, setModelSourceType] = useState<string | null>(null);
  const [checkPointType, setCheckPointType] = useState<string | null>(null);
  const [currentConfigTab, setCurrentConfigTab] = useState<CONFIG_TYPE>(CONFIG_TYPE.train);
  const [showConfig, setShowConfig] = useState(false);
  const [params, setParams] = useState<number | null>(null);

  const onCloseModelConfig = () => {
    setShowConfig(false);
  }

  const onSaveConfig = useCallback(() => {
    if (config) {
      for (let i = 0; i < config[currentConfigTab]?.arguments.length; i++) {
        if (config[currentConfigTab].arguments[i].name.trim().length === 0) {
          infoDialog({
            title: "Argument error",
            message: `The name of the argument #${i + 1} is empty. Please this argument or give it a name.`,
            className: "c-connect__args-model"
          });
          return;
        }
      }
      setShowConfig(false);
    }
  }, [config, currentConfigTab]);

  const fieldsModelSource = useMemo(() => {
    switch (modelSourceType) {
      case "HUGGING_FACE":
        return [
          {
            name: "model_id",
            label: "Model ID",
            placeholder: "Type here",
            isRequired: true,
          },
          {
            name: "model_token",
            label: "Token (If private)",
            placeholder: "Type here",
            isRequired: false,
          },
        ];
      case "ROBOFLOW":
        return [
          {
            name: "model_id",
            label: "Model ID",
            placeholder: "Type here",
            isRequired: true,
          },
          {
            name: "model_token",
            label: "Token",
            placeholder: "Type here",
            isRequired: false,
          },
        ];
      case "GIT":
        return [
          {
            name: "model_id",
            label: "Model URL",
            placeholder: "Type here",
            isRequired: true,
          },
          {
            name: "model_token",
            label: "Token",
            placeholder: "Type here",
            isRequired: false,
          },
        ]
      default:
        return [
          {
            name: "model_id",
            label: "Docker Image",
            placeholder: "Type here",
            isRequired: true,
          },
          {
            name: "model_token",
            label: "Docker Access Token",
            placeholder: "Type number",
            isRequired: false,
          },
        ];
    }
  }, [modelSourceType]);

  const fieldsCheckPoint = useMemo(() => {
    switch (checkPointType) {
      case "HUGGING_FACE":
        return [
          {
            name: "checkpoint_id",
            label: "ID",
            placeholder: "Type here",
            isRequired: false,
          },
          {
            name: "checkpoint_token",
            label: "Token (If private)",
            placeholder: "Type here",
            isRequired: false,
          },
        ];
      case "ROBOFLOW":
        return [
          {
            name: "checkpoint_id",
            label: "ID",
            placeholder: "Type here",
            isRequired: false,
          },
          {
            name: "checkpoint_token",
            label: "Token",
            placeholder: "Type here",
            isRequired: false,
          },
        ];
      case "GIT":
        return [
          {
            name: "checkpoint_id",
            label: "Checkpoint URL",
            placeholder: "Type here",
            isRequired: false,
          },
          {
            name: "checkpoint_token",
            label: "Token",
            placeholder: "Type here",
            isRequired: false,
          },
        ]
      default:
        return [
          {
            name: "checkpoint_id",
            label: "ID",
            placeholder: "Type here",
            isRequired: false,
          },
          {
            name: "checkpoint_token",
            label: "Token",
            placeholder: "Type here",
            isRequired: false,
          },
        ]
    }
  }, [checkPointType]);

  useEffect(() => {
    if (estimateTime && +estimateTime < 1) {
      setEstimateTime("1");
    }
  }, [estimateTime]);

  useEffect(() => {
    onUpdateModelData?.((prev: any) => ({
      ...prev,
      // token_length: token,
      // accuracy: accuracy,
      // sampling_frequency: samplingFrequency,
      // mono: mono,
      // fps: fps,
      // resolution: resolution,
      // image_width: imageSize.width,
      // image_height: imageSize.height,
      framework: framework,
      modeltype: modeltype,
      // precision: precision,
      // project
      project: {
        ...prev.project,
        // epochs: epochs,
        // batch_size: batchSize,
        // batch_size_per_epochs: batchSizePerEpochs,
      },
      // data FLOPs, MAC, Params
      calculate_compute_gpu: {
        ...prev.calculate_compute_gpu,
        ...calculateComputeGpu,
      },
      // time, cost user want to train
      rent_time: rentTime,
      rent_cost: rentCost,
      estimate_time: estimateTime,
      estimate_cost: estimateCost,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // imageSize,
    // mono,
    // samplingFrequency,
    // fps,
    // resolution,
    framework,
    modeltype,
    // token,
    // epochs,
    // batchSize,
    // batchSizePerEpochs,
    // accuracy,
    // precision,
    estimateTime,
    estimateCost,
    onUpdateModelData,
    calculateComputeGpu?.gpu_memory,
    calculateComputeGpu?.mac,
    calculateComputeGpu?.paramasters,
    calculateComputeGpu?.tflops,
    calculateComputeGpu?.time,
    calculateComputeGpu?.total_cost,
    calculateComputeGpu?.total_power_consumption,
    rentCost,
    rentTime
  ]);

  // const handleImageSizeChange = (fieldName: string, value: string) => {
  //   setImageSize((prevState) => ({
  //     ...prevState,
  //     [fieldName]: value,
  //   }));
  //   storeInputFields({ projectID, imageSize: { ...imageSize, [fieldName]: value } })
  // };
  //
  // const handleMonoChange = (newValue: boolean) => {
  //   setMono(newValue);
  //   storeInputFields({ projectID, mono: newValue })
  // };
  //
  // const handleSamplingFrequencyChange = (
  //   event: ChangeEvent<HTMLInputElement>
  // ) => {
  //   setSamplingFrequency(event.target.value);
  //   storeInputFields({ projectID, samplingFrequency: event.target.value })
  // };
  //
  // const handleFpsChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   setFps(event.target.value);
  //   storeInputFields({ projectID, fps: event.target.value })
  // };
  //
  // const handleResolutionChange = (option: SelectOption) => {
  //   setResolution(option.value);
  //   storeInputFields({ projectID, resolution: option.value })
  // };
  //
  // const handleTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   setToken(event.target.value);
  //   storeInputFields({ projectID, token: event.target.value })
  // };
  //
  // const handleEpochsChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const value = event.target.value;
  //   const numberValue = parseInt(value, 10);
  //
  //   if ((numberValue > 0 &&  numberValue <= 1000)) {
  //     setEpochs(event.target.value);
  //     storeInputFields({ projectID, epochs: event.target.value })
  //   }else if (numberValue > 1000){
  //     setEpochs('1000');
  //     storeInputFields({ projectID, epochs: '1000' });
  //   }
  //   else {
  //     setEpochs('1');
  //     storeInputFields({ projectID, epochs: '1' });
  //   }
  //
  // };
  //
  // const handleBatchSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const value = event.target.value;
  //   const numberValue = parseInt(value, 10);
  //
  //   if ((numberValue > 0 &&  numberValue <= 500)) {
  //     setBatchSize(event.target.value);
  //     storeInputFields({ projectID, batchSize: event.target.value })
  //   }else if(numberValue >500) {
  //     setBatchSize('500');
  //     storeInputFields({ projectID, batchSize: '500' })
  //   }else{
  //     setBatchSize('1');
  //     storeInputFields({ projectID, batchSize: '1' });
  //   }
  // };
  //
  // const handleBatchSizePerEpochsChange = (
  //   event: ChangeEvent<HTMLInputElement>
  // ) => {
  //   const value = event.target.value;
  //   const numberValue = parseInt(value, 10);
  //
  //   if ((numberValue > 0 &&  numberValue <= 1000)) {
  //     setBatchSizePerEpochs(value);
  //     storeInputFields({ projectID, batchSizePerEpochs: value });
  //   }else if(numberValue > 1000){
  //     setBatchSizePerEpochs('1000');
  //     storeInputFields({ projectID, batchSizePerEpochs: '1000' });
  //   }
  //   else {
  //     setBatchSizePerEpochs('1');
  //     storeInputFields({ projectID, batchSizePerEpochs: '1' });
  //   }
  // };
  //
  // const handleAccuracyChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   setAccuracy(event.target.value);
  //   storeInputFields({ projectID, accuracy: event.target.value })
  // };
  //
  // const handlePrecisionChange = (precision: "FP16" | "BF16" | null) => {
  //   setPrecision(precision);
  //   storeInputFields({ projectID, precision })
  // };

  const handleEstimateTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRentTime(event.target.value);
    storeInputFields({ projectID, estimateTime: event.target.value, rentTime: event.target.value })
  };

  const handleEstimateCostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const calculatePrice = model?.type === "MODEL-SYSTEM" ? model?.price : (+rentTime * +rentCost) / +event.target.value;
    setRentCost(String(calculatePrice))
    storeInputFields({ projectID, estimateCost: event.target.value, rentCost: calculatePrice })
  };

  // const isLlmType = useMemo(() => {
  //   if (!annotation?.catalog_model?.key) return false;
  //   return annotation?.catalog_model.key === "generative_ai"
  //     || annotation?.catalog_model.key === "llm"
  //     || annotation?.catalog_model.key === "nlp";
  // }, [annotation?.catalog_model?.key]);
  //
  // const isAsrType = useMemo(
  //   () => annotation?.catalog_model?.key && annotation?.catalog_model.key === "audio_speech_processing",
  //   [annotation?.catalog_model?.key]
  // );
  //
  // const isCvType = useMemo(
  //   () => annotation?.catalog_model?.key && annotation?.catalog_model.key === "computer_vision",
  //   [annotation?.catalog_model?.key]
  // );
  //
  // const isVideoType = useMemo(() => {
  //   // eslint-disable-next-line no-mixed-operators
  //   return Object.keys(detail?.data_types ?? {}).indexOf("video") > -1 || annotation?.catalog_model?.key === "video";
  // }, [annotation?.catalog_model?.key, detail?.data_types]);

  const modelID = useMemo(() => model?.id ?? 0, [model?.id]);

  const gpuListIds = useMemo(() => {
    return (
      gpusFilter
        ? gpusFilter.flatMap((gpuList) =>
          gpuList ? gpuList.compute_gpus.map((gpu) => gpu.id.toString()) : []
        )
        : []
    ).join(",");
  }, [gpusFilter]);

  useEffect(() => {
    let controller: AbortController;

    // if (gpuListIds.length > 0 && isFetchComputes?.current && paramsValue) {
      if (gpuListIds.length > 0 && isFetchComputes?.current) {
      const urlSearchParams = new URLSearchParams();

      urlSearchParams.append("project_id", projectID.toString());
      urlSearchParams.append("model_id", modelID.toString());

      // if (paramsValue) {
      //   urlSearchParams.append("paramaster", paramsValue.toString());
      // } else {
      // }

      urlSearchParams.append("paramaster", "check");

      if (gpuListIds.length > 0) {
        urlSearchParams.append("gpu_list_id", gpuListIds);
      }

      if (framework) {
        urlSearchParams.append("framework", framework);
      }

      if (modeltype) {
        urlSearchParams.append("modeltype", modeltype);
      }

      // if (isCvType) {
      //   if (imageSize.width) {
      //     urlSearchParams.append("image_width", imageSize.width);
      //   }
      //
      //   if (imageSize.height) {
      //     urlSearchParams.append("image_height", imageSize.height);
      //   }
      // }
      //
      // if (isLlmType) {
      //   if (token) {
      //     urlSearchParams.append("token", token);
      //   }
      // }
      //
      // if (isAsrType) {
      //   if (samplingFrequency) {
      //     urlSearchParams.append("sampling_frequency", samplingFrequency);
      //   }
      //
      //   if (mono) {
      //     urlSearchParams.append("mono", (mono ? 1 : 0).toString());
      //   }
      // }
      //
      // if (isVideoType) {
      //   if (resolution) {
      //     urlSearchParams.append("resolution", resolution);
      //   }
      //
      //   if (fps) {
      //     urlSearchParams.append("fps", fps);
      //   }
      // }
      //
      // if (epochs) {
      //   urlSearchParams.append("epochs", epochs);
      // }
      //
      // if (batchSize) {
      //   urlSearchParams.append("batch_size", batchSize);
      // }
      //
      // if (batchSizePerEpochs) {
      //   urlSearchParams.append("batch_size_per_epochs", batchSizePerEpochs);
      // }
      //
      // if (accuracy) {
      //   urlSearchParams.append("accuracy", accuracy);
      // }
      //
      // if (precision) {
      //   urlSearchParams.append("precision", precision);
      // }
      //
      // if (!!cpuIds?.length) {
      //   urlSearchParams.append("cpu_list_id", cpuIds.join(","));
      // }
      //prevent request duplicated

      setIsLoading(true);
      setDisableSubmit(true);

      const ar = api.call("calculateComputeGpu", {
        query: urlSearchParams,
      });

      controller = ar.controller;

      ar.promise
        .then(async r => {
          if (ar.controller.signal.aborted) return;

          if (r.ok) {
            const data = await r.json();

            if (!data.can_rent) {
              setIsOpenModalConfirm(true);
              setDisableSubmit(true);
            }

            setCalculateComputeGpu(data);
            setEstimateTime(data.time)
            setRentCost(data.total_cost)
            setEstimateCost(data.total_cost)
            setParams(parseInt(data.paramasters));

            // if (!paramsValue) {
            //   handleParamsChange?.(parseInt(data.paramasters));
            // }

            if (data && data.total_cost && data.can_rent) {
              setDisableSubmit(false);
            }
          }
        })
        .catch(_ => {
        })
        .finally(() => {
          if (ar.controller.signal.aborted) return;
          setIsLoading(false);
          isFetchComputes.current = false;
        })
    }

    return () => {
      controller?.abort("Params changed");
    }
  }, [api, gpuListIds, isFetchComputes, modelID, projectID, setDisableSubmit, framework, modeltype]);

  const totalCost = useMemo(() => {
    if (model?.price > 0) {
      return (model.price * Math.abs(parseInt(rentTime))) + Math.abs(parseInt(estimateCost));
    }

    return 0;
  }, [estimateCost, model?.price, rentTime]);

  const {x, y} = convertFLOP(calculateComputeGpu?.tflops);
  const {x: gpu_mem, y: unit} = formatGpuMem(calculateComputeGpu?.gpu_memory);

  // useEffect(() => {
  //   const currentInputs = getStoreInputFields(projectID);
  //   if (currentInputs) {
  //     currentInputs.samplingFrequency && setSamplingFrequency(currentInputs.samplingFrequency);
  //     currentInputs.fps && setFps(currentInputs.fps);
  //     currentInputs.token && setToken(currentInputs.token);
  //     currentInputs.mono !== undefined && setMono(currentInputs.mono);
  //     currentInputs.imageSize && setImageSize(currentInputs.imageSize);
  //     currentInputs.resolution && setResolution(currentInputs.resolution);
  //     currentInputs.framework && setFramework(currentInputs.framework);
  //     currentInputs.accuracy && setAccuracy(currentInputs.accuracy);
  //     currentInputs.precision && setPrecision(currentInputs.precision);
  //     currentInputs.epochs && setEpochs(currentInputs.epochs);
  //     currentInputs.batchSize && setBatchSize(currentInputs.batchSize);
  //     currentInputs.batchSizePerEpochs && setBatchSizePerEpochs(currentInputs.batchSizePerEpochs);
  //     // currentInputs.estimateTime && setEstimateTime(currentInputs.estimateTime);
  //     // currentInputs.estimateCost && setEstimateCost(currentInputs.estimateCost);
  //   }
  // }, [projectID]);
  //
  // const handleParamsInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (!handleParamsChange) {
  //     return
  //   }
  //
  //   const newParams = parseInt(e.target.value);
  //
  //   if (maxParams && newParams > maxParams) {
  //     handleParamsChange(maxParams);
  //   } else if (newParams < 100) {
  //     handleParamsChange(100);
  //   } else {
  //     handleParamsChange(newParams);
  //   }
  // }, [handleParamsChange, maxParams]);

  return (
    <div className={'c-model-preview'}>
      <div className="c-model-preview__row">
        <div className="c-model-preview__group gray g-12">
          {props.children}
          <div className="c-model-preview__row__wrapper">
            <div className="c-model-preview__item" key="params">
              <div className="c-model-preview__item__label">
                <label>Params:</label>
                {/*<span className="required">*</span>*/}
              </div>
              {/*<InputBase
                isControlledValue={true}
                value={paramsValue ? paramsValue.toString() : ""}
                allowClear={false}
                className="c-model-preview__item__input-number"
                placeholder="..."
                type="number"
                onBlur={handleParamsInputChange}
                onChange={handleParamsInputChange}
                validateNonNegativeInteger={true}
              />*/}
              <div className="c-model-preview__item__input-number">
                { gpuListIds.length > 0 ? (params ?? "-") : "-" }
              </div>
            </div>
            <div className="c-model-preview__item" key="flops">
              <span>FLOPs:</span>
              <div className="c-model-preview__item__input-number">
                {/* {(gpuListIds.length > 0 && paramsValue && x) && <span>{x}</span>} */}
                {gpuListIds.length > 0 ? <span>{x}</span> : "-"}
              </div>
              <span className="available">{y}</span>
            </div>
            <div className="c-model-preview__item danger" key="macs">
              <span>GPU Mem:</span>
              <div className="c-model-preview__item__input-number">
                {gpuListIds.length > 0 ? <span>{gpu_mem}</span> : "-"}
                {/* {
                  ((cpuFilters && cpuFilters.length > 0) ||
                    (gpusFilter && gpusFilter.length > 0 && calculateComputeGpu && calculateComputeGpu?.gpu_memory > 0)) && (
                    <>
                      {calculateComputeGpu && (
                        <div className="c-model-preview__group__detail" key={`key-gpu`}>
                          {(gpuListIds.length > 0 && paramsValue && gpu_mem) && gpu_mem}
                        </div>
                      )}
                    </>
                  )
                } */}
              </div>
              <span className="available">{unit}</span>
            </div>
          </div>
        </div>
      </div>
      {modelPreviewType === "ADD-MODEL" &&
        <div className="c-model-preview__row justify">
          <div className="c-model-preview__group gray">
            <InputRender
              title="Model Source"
              setType={setModelSourceType}
              fields={fieldsModelSource}
              onFieldChange={onFieldChange}
              dataSelect={ModelSource}
              type={"model_source"}
              addModelData={addModelData}
              setAddModelData={setAddModelData}
              currentField={modelSourceType}
              setIsInValid={setIsInValidModelSource}
              isRequired
            />
          </div>
          <div className="c-model-preview__group gray">
            <InputRender
              title="Checkpoint"
              setType={setCheckPointType}
              fields={fieldsCheckPoint}
              onFieldChange={onFieldChange}
              dataSelect={Checkpoint}
              type={"checkpoint_source"}
              addModelData={addModelData}
              setAddModelData={setAddModelData}
              currentField={checkPointType}
              setIsInValid={setIsInValidCheckpoint}
            />
          </div>
        </div>
      }
      {/*<div className="c-model-preview__group-wrapper">*/}
      {/*  /!* modal option of project type *!/*/}
      {/*  {isLoading ? <div className="c-model-preview__group loading">*/}
      {/*    <IconLoading width={30} height={30} /> Loading...*/}
      {/*  </div> : (*/}
      {/*    ((cpuFilters && cpuFilters.length > 0) ||*/}
      {/*      (gpusFilter && gpusFilter.length > 0 && calculateComputeGpu && calculateComputeGpu?.gpu_memory > 0)) && (*/}
      {/*      <div className={"c-model-preview__group"}>*/}
      {/*        {cpuFilters?.map((i: any, index: number) => {*/}
      {/*          return (*/}
      {/*            <div className="c-model-preview__group__detail" key={`key-${index}`}>*/}
      {/*              <div>{`${index + 1}. CPU`}</div>*/}
      {/*              <div>*/}
      {/*                <span>*/}
      {/*                  {`Memory: */}
      {/*                      ${formatRAM(i?.ram)} - Storage: ${formatRAM(i?.disk)} ${i?.ip ? `-  ${i.ip}` : ""}`}*/}
      {/*                </span>*/}
      {/*              </div>*/}
      {/*            </div>*/}
      {/*          );*/}
      {/*        })}*/}
      {/*      </div>*/}
      {/*    )*/}
      {/*  )}*/}
      {/*</div>*/}
      {/*{(isAsrType || isLlmType) && (
        <div className={"c-model-preview__group"}>
          <div className={"c-model-preview__row justify"}>
            {isLlmType && (
              <div className={"c-model-preview__input-column"}>
                <label>Sequence token length:</label>
                <InputBase
                  value={token}
                  allowClear={false}
                  className="percents__item__input-number"
                  placeholder="Enter token length"
                  type="number"
                  onBlur={handleTokenChange}
                  validateNonNegativeInteger={true}
                />
              </div>
            )}
            {isAsrType &&
              <div className={"c-model-preview__input-column"}>
                <label>Sampling frequency: </label>
                <InputBase
                  value={samplingFrequency}
                  allowClear={false}
                  className="c-percents__item-input"
                  placeholder="Sampling frequency"
                  type="number"
                  onBlur={handleSamplingFrequencyChange}
                  validateNonNegativeInteger={true}
                />
              </div>
            }
            <div className={"c-model-preview__input-row col3"}>
              <label>Mono: </label>
              <div className={"c-model-preview__checkbox"}>
                <Checkbox
                  label="True"
                  checked={mono}
                  onChange={(value) => handleMonoChange(value)}
                  size="sm"
                />
                <Checkbox
                  label="False"
                  checked={!mono}
                  onChange={(value) => handleMonoChange(!value)}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}*/}
      {modelSourceType &&
        <div className={"c-model-preview__group gray g-12"}>
          <div className={"c-model-preview__row"}>
            <div className={"c-model-preview__input-column"}>
              <button className="c-model-preview__advanced-settings" onClick={() => setShowConfig(true)}>
                Advanced settings
                <IconPlusSquare />
              </button>
            </div>
          </div>
        </div>
      }
       <div className={"c-model-preview__group"}>
        <div className={"c-model-preview__row"}>
          <div className={"c-model-preview__input-column"}>
            <label>Framework: </label>
            <Select
              className={"c-model-preview__select"}
              defaultValue={dataFramework[0]["options"].find(o => o.value === framework)}
              data={dataFramework}
              onChange={o => setFramework(o.value)}
            />
          </div>
        </div>
      </div>
      
      {!isDeploy && (
        <div className={"c-model-preview__group"}>
        <div className={"c-model-preview__row"}>
          <div className={"c-model-preview__input-column"}>
            <label>Model Type: </label>
            <Select
              className={"c-model-preview__select"}
              defaultValue={dataModelType[0]["options"].find(o => o.value === modeltype)}
              data={dataModelType}
              onChange={o => setModelType(o.value)}
            />
          </div>
        </div>
      </div>
      )}
      
      {/*{isCvType && (
        <div className="c-model-preview__row">
          <React.Fragment >
            <div className={"c-model-preview__group"}>
              <div className={"c-model-preview__row justify"}>
                <div className={"c-model-preview__input-column"}>
                  <label>Image size: </label>
                  <div className={"c-model-preview__input-row"}>
                    <InputBase
                      value={imageSize.width}
                      allowClear={false}
                      className="c-percents__item-input"
                      placeholder="Enter image width"
                      type="number"
                      onBlur={(e) =>
                        handleImageSizeChange("width", e.target.value)
                      }
                      validateNonNegativeInteger={true}
                    />
                    <label>x </label>
                    <InputBase
                      value={imageSize.height}
                      allowClear={false}
                      className="c-percents__item-input"
                      placeholder="Enter image height"
                      type="number"
                      onBlur={(e) =>
                        handleImageSizeChange("height", e.target.value)
                      }
                      validateNonNegativeInteger={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        </div>
      )}*/}
      {/*{isVideoType && (
        <div className="c-model-preview__row">
          <React.Fragment>
            <div className={"c-model-preview__group"}>
              <div className={"c-model-preview__row justify"}>
                <div className={"c-model-preview__input-column"}>
                  <label>Fps: </label>
                  <InputBase
                    value={fps}
                    allowClear={false}
                    className="c-percents__item-input"
                    placeholder="Enter Fps"
                    type="number"
                    onBlur={handleFpsChange}
                    validateNonNegativeInteger={true}
                  />
                </div>
                <div className={"c-model-preview__input-column"}>
                  <label>Resolution: </label>
                  <Select
                    className={"c-model-preview__select"}
                    defaultValue={{ label: '320', value: '320' }}
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
                    onChange={handleResolutionChange}
                  />
                </div>
              </div>
            </div>
          </React.Fragment>
        </div>
      )}*/}
      {/*<div className="c-model-preview__row">
        {/!* load Epochs,Batch Size,batch size per Epochs,accuracy from ml learning  *!/}
        <div className={"c-model-preview__group gray"}>
          <div className={"c-model-preview__row justify"}>
            <div className={"c-model-preview__input-column"}>
              <label>Epochs:</label>
              <InputBase
                isControlledValue={true}
                value={epochs}
                allowClear={false}
                className=""
                placeholder="Enter epochs"
                type="number"
                onBlur={handleEpochsChange}
                onChange={handleEpochsChange}
              />
            </div>
            <div className={"c-model-preview__input-column"}>
              <label>Batch Size:</label>
              <InputBase
                isControlledValue={true}
                value={batchSize}
                allowClear={false}
                className=""
                placeholder="Enter batch size"
                type="number"
                onBlur={handleBatchSizeChange}
                onChange={handleBatchSizeChange}
              />
            </div>
          </div>
          <div className={"c-model-preview__row justify"} style={{marginTop: 16}}>
            <div className={"c-model-preview__input-column"}>
              <label className={"c-model-preview__item__label"}>Batch size per Epochs:</label>
              <InputBase
                isControlledValue={true}
                value={batchSizePerEpochs}
                allowClear={false}
                className={"c-model-preview__item__input"}
                placeholder="Enter Batch size per epochs"
                type="number"
                onBlur={handleBatchSizePerEpochsChange}
                onChange={handleBatchSizePerEpochsChange}
              />
            </div>
            <div className={"c-model-preview__input-column"}>
              <label>Accuracy:</label>
              <InputBase
                value={accuracy}
                allowClear={false}
                className=""
                placeholder="Enter accuracy"
                type="number"
                onBlur={handleAccuracyChange}
              />
            </div>
          </div>
          {/!*<div className={"c-model-preview__row justify"} style={{marginTop: 16}}>
            <div className={"c-model-preview__input-column"}>
              <label>Precision: </label>
              <div style={{marginTop: 6, display: "flex", justifyContent: "flex-start", gap: 16}}>
                <Checkbox
                  label={"FP16"}
                  checked={precision === "FP16"}
                  onChange={v => handlePrecisionChange(v ? "FP16" : null)}
                />
                <Checkbox
                  label={"BF16"}
                  checked={precision === "BF16"}
                  onChange={v => handlePrecisionChange(v ? "BF16" : null)}
                />
              </div>
              <Select
                className={"c-model-preview__select"}
                defaultValue={{ label: precision.toLocaleUpperCase(), value: precision }}
                data={dataPrecision}
                onChange={(option: SelectOption) => {
                  handlePrecisionChange(option);
                }}
              />
            </div>
          </div>*!/}
        </div>
      </div>*/}
      {modelPreviewType === "RENT-MODEL" && !props.installable &&
        <div className="p-model-selected__info">
          <div className={"c-model-preview__row"}>
            <div className={"c-model-preview__input-column flex-none w-50-12"}>
              <label className={"c-model-preview__item__label"}>How many hours would you like to rent?</label>
              <InputBase
                isControlledValue={true}
                value={rentTime.toString()}
                allowClear={false}
                className={"c-model-preview__estimate"}
                placeholder="Enter time train"
                type="number"
                onChange={ev => handleEstimateTimeChange(ev)}
                onBlur={(event) => handleEstimateCostChange(event)}
                customRightItem={<span>Hours</span>}
              />
            </div>
          </div>
        </div>
      }
      {showEstimateCost && modelPreviewType === "RENT-MODEL" && !props.installable && (
        <div className={"c-model-preview__row"}>
          <div className={"c-model-preview__input-column"}>
            {/* <label className={"c-model-preview__item__label"}>Estimate cost: <span className="primary"> {+estimateCost} {calculateComputeGpu?.token_symbol}</span></label> */}
            <label className={"c-model-preview__item__label"}>Price Unit:&nbsp;
              <span className="primary">
                {/* {
                  model.type === "MODEL-SYSTEM" ? model.price : +rentCost
                } {calculateComputeGpu?.token_symbol}/hour */}
                {model.price}/hour
              </span>
            </label>
            <label className={"c-model-preview__item__label"}>Total cost:&nbsp;
              <span className="primary">
                {formatFloat(totalCost)}$
              </span>
            </label>
          </div>
        </div>
      )}
      <Modal
        title="You don't have enough compute"
        iconTitle={<IconError />}
        cancelText="Cancel"
        submitText="Add More Computes"
        closeOnOverlayClick={true}
        open={isOpenModalConfirm}
        onClose={() => setIsOpenModalConfirm(false)}
        onCancel={() => setIsOpenModalConfirm(false)}
        onSubmit={() => {
          window.open('/computes', '_blank');
          setIsOpenModalConfirm(false)
          // setOpenModalModel(false)
        }}
      >
        Insufficient computing power detected.<br />
        Please add more computes.
      </Modal>
      {/* <Modal
        title="Add compute completed"
        iconTitle={<IconSuccess />}
        submitText="Finish"
        closeOnOverlayClick={true}
        open={isOpenModalAddComputeDone}
        onClose={() => setIsOpenModalAddComputeDone(false)}
        onSubmit={() => setIsOpenModalAddComputeDone(false)}
      >
        Time for a quick musical interlude! We're setting up Docker containers and environments on the computes just for you. This process typically takes about 1 minute per compute, although timing can vary based on the internet connection from the GPU provider. We appreciate your patience!
      </Modal> */}
      <Suspense>
        <Modal
          open={showConfig}
          onClose={() => onCloseModelConfig()}
          title="Configure"
          submitText="Save"
          className="c-connect__model-config"
          onSubmit={() => onSaveConfig()}
        >
          <FormConfig
            config={config}
            setConfig={setConfig}
            currentConfigTab={currentConfigTab} 
            setCurrentConfigTab={setCurrentConfigTab} 
          />
        </Modal>
      </Suspense>
    </div>
  );
};

export default ModelPreview;
