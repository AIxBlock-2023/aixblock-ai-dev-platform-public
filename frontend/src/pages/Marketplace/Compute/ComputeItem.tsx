import React, {useCallback, useMemo, useState} from "react";
import "./ComputeItem.scss";
import Button from "@/components/Button/Button";
import {formatFloat, formatBytesOrGB} from "@/utils/customFormat";
import IconPlusCircle from "@/assets/icons/IconPlusCircle";
import CheckboxSelect from "./MultipleSelect/MultipleSelect";
import {MACHINE_TYPES_LIST, TComputeMarketplaceV2SelectedOption} from "./types";
import {Tooltip} from "react-tooltip";
import IconTinyEdit from "@/assets/icons/IconTinyInfo";

export type TProps = {
  compute_id?: number | string | null,
  vendor_id?: number | string | null,
  datacenter?: string | null,
  num_gpus?: number | null,
  location?: string | null,
  machine_type?: string | null,
  service?: string | null,
  gpus: Array<{
    id: number,
    vast_contract_id: number,
    provider_name: string,
    name: string,
    price: number,
    token_symbol: string,
    unit: string,
    ids: number[],
  }>,
  gpu_tflops?: string | null,
  max_cuda_version?: number | null,
  per_gpu_ram?: string | null,
  per_gpu_memory_bandwidth?: number | string | null,
  motherboard?: string | null,
  number_of_pcie_per_gpu?: string | null,
  cpu?: string | null,
  eff_out_of_total_nu_of_cpu_virtual_cores?: string | null,
  eff_out_of_total_system_ram?: string | null,
  internet_down_speed?: number | string | null,
  internet_up_speed?: number | string | null,
  max_duration?: number | string | null,
  reliability?: number | string | null,
  onRent: (cards: TComputeMarketplaceV2SelectedOption[]) => void,
  os?: string | null,
  ram?: number | null,
  diskSize?: string | null,
  diskType?: string | null,
  provider_id?: number | null,
}

export default function ComputeItem(props: TProps) {
  const [selectedCard, setSelectedCard] = useState<TComputeMarketplaceV2SelectedOption[]>([]);

  const priceRange = useMemo((): {min: TProps["gpus"][0] | null, max: TProps["gpus"][0] | null} => {
    let max: TProps["gpus"][0] | null = null;
    let min: TProps["gpus"][0] | null = null;

    props.gpus.forEach(g => {
      if (!max || g.price > max.price) {
        max = {...g};
      }

      if (!min || g.price < min.price) {
        min = {...g};
      }
    });

    if (props.gpus.length < 2) {
      min = null;
    }

    return {min, max};
  }, [props.gpus]);

  const options = useMemo((): TComputeMarketplaceV2SelectedOption[] => {
    return props.gpus.map(g => {
      const canInstallAllService = props.machine_type === "physical-machines";

      return {
        id: g.id.toString(),
        label: g.name,
        hours: 1,
        price: g.price,
        quantity: 1,
        tokenSymbol: g.token_symbol,
        gpu_name: g.name,
        ids: g.ids.map(v => v.toString()),
        is_cpu: false,
        totalPrice: g.price,
        vast_contract_id: g.vast_contract_id,
        provider_name: g.provider_name,
        services: "model-training",// canInstallAllService ? "all" : "label-tool",
        specs: {
          os: props.os,
          ram: props.ram,
          diskSize: props.diskSize,
          diskType: props.diskType,
        },
        canInstallAllService,
      }
    });
  }, [props.diskSize, props.diskType, props.gpus, props.machine_type, props.os, props.ram]);

  const hasSingleOption = useMemo(() => options.length === 1 && options[0].ids.length === 1, [options]);

  const handleRentClick = useCallback(() => {
    if (hasSingleOption) {
      props.onRent([options[0]]);
    } else if (selectedCard.length > 0) {
      props.onRent(selectedCard);
    }
  }, [hasSingleOption, options, props, selectedCard]);

  const tooltipPrefix = useMemo(() => {
    return "tooltip-" + (props.compute_id ?? Math.random().toString().substring(2, 8)) + "-";
  }, [props.compute_id]);

  return (
    <div className="p-computes-marketplace-v2-compute">
      <div className="p-computes-marketplace-v2-compute__inner">
        <div className="badges">
          <span className="badge" id={tooltipPrefix + "compute-id"}>
            {props.compute_id ?? "??????"}&nbsp;
            <IconTinyEdit style={{transform: "translateY(1px)"}}/>
          </span>
          <Tooltip place="top" positionStrategy="fixed" content="Compute ID"
                   anchorSelect={"#" + tooltipPrefix + "compute-id"} />
          <span className="badge" id={tooltipPrefix + "provider-id"}>
            {props.provider_id ?? "??????"}&nbsp;
            <IconTinyEdit style={{transform: "translateY(1px)"}} />
          </span>
          <Tooltip place="top" positionStrategy="fixed" content="Provider ID"
                   anchorSelect={"#" + tooltipPrefix + "provider-id"} />
          {props.datacenter && <span className="badge badge--green">{props.datacenter}</span>}
          <span className="badge">{props.location ?? "Unknown"}</span>
          <span className="badge badge--purple">
            {
              props.machine_type
                ? MACHINE_TYPES_LIST[props.machine_type as keyof typeof MACHINE_TYPES_LIST]
                : MACHINE_TYPES_LIST["virtual-machines"]
            }
          </span>
          <span className="badge badge--black">Service: {props.service?.toLowerCase() ?? "???"}</span>
        </div>
        <div className="columns">
          <div className="column column--gpu">
            {props.gpus.length > 0 && (
              <React.Fragment>
                <CheckboxSelect
                  id={tooltipPrefix + "product-name"}
                  onHandleSelect={(options) => setSelectedCard(options)}
                  label={props.gpus[0].name}
                  num_gpus={props.num_gpus ?? 1}
                  options={hasSingleOption ? [] : options}
                />
                <Tooltip place="top" positionStrategy="fixed" content="Product Name"
                         anchorSelect={"#" + tooltipPrefix + "product-name"}/>
              </React.Fragment>
            )}
            <div className="split">
              <div className="left">
                <div className="tflops" id={tooltipPrefix + "tflops"}>
                  <strong>{props.gpu_tflops ? formatFloat(parseFloat(props.gpu_tflops)) : "???"}</strong> <span className="unit">TFLOPS</span>
                </div>
                <Tooltip place="left" positionStrategy="fixed" content="Total GPU TeraFLOPs"
                         anchorSelect={"#" + tooltipPrefix + "tflops"}/>
                <div className="cuda" id={tooltipPrefix + "cuda"}>
                  Max CUDA: {props.max_cuda_version ?? "???"}
                </div>
                <Tooltip place="left" positionStrategy="fixed" content="Maximum CUDA Version Supported"
                         anchorSelect={"#" + tooltipPrefix + "cuda"}/>
              </div>
              <div className="right">
                <div className="gpu-ram" id={tooltipPrefix + "gpu-ram"}>{formatBytesOrGB(props.per_gpu_ram) ?? "???"} GB</div>
                <Tooltip place="top" positionStrategy="fixed" content="Per GPU RAM"
                         anchorSelect={"#" + tooltipPrefix + "gpu-ram"}/>
                <div className="gpu-bw" id={tooltipPrefix + "gpu-bw"}>{formatBytesOrGB(props.per_gpu_memory_bandwidth) ?? "???"} GB/s</div> 
                <Tooltip place="bottom" positionStrategy="fixed" content="Per GPU Memory Bandwidth"
                         anchorSelect={"#" + tooltipPrefix + "gpu-bw"}/>
              </div>
            </div>
          </div>
          <div className="column column--cpu">
            <div className="motherboard" id={tooltipPrefix + "motherboard"}>{props.motherboard ?? "???"}</div>
            <Tooltip place="top-start" positionStrategy="fixed" content="Motherboard"
                     anchorSelect={"#" + tooltipPrefix + "motherboard"}/>
            <div className="pcie">{props.number_of_pcie_per_gpu ?? "???"}</div>
            <div className="cpu" id={tooltipPrefix + "cpu"}>{props.cpu ?? "???"}</div>
            <Tooltip place="bottom-start" positionStrategy="fixed" content="CPU"
                     anchorSelect={"#" + tooltipPrefix + "cpu"}/>
            <div className="cpu-ram">
              <span>{props.eff_out_of_total_nu_of_cpu_virtual_cores ?? "???"} CPU</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span>{props.eff_out_of_total_system_ram ?? "???"} GB</span>
            </div>
          </div>
          <div className="column column--network">
            <div className="upload" id={tooltipPrefix + "upload"}>
              <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.28704 6.37988L8.3337 2.33322L12.3804 6.37988" stroke="#40405B" strokeWidth="1.5"
                      strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.3335 13.667V2.44699" stroke="#40405B" strokeWidth="1.5" strokeMiterlimit="10"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <strong>{props.internet_up_speed ?? "???"} Mbps</strong>
            </div>
            <Tooltip place="top-start" positionStrategy="fixed" content="Internet Upload Speed (Shared)"
                     anchorSelect={"#" + tooltipPrefix + "upload"}/>
            <div className="download" id={tooltipPrefix + "download"}>
              <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.38 9.62012L8.33329 13.6668L4.28662 9.62012" stroke="#40405B" strokeWidth="1.5"
                      strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.3335 2.33301V13.553" stroke="#40405B" strokeWidth="1.5" strokeMiterlimit="10"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <strong>{props.internet_down_speed ?? "???"} Mbps</strong>
            </div>
            <Tooltip place="bottom-start" positionStrategy="fixed" content="Internet Download Speed (Shared)"
                     anchorSelect={"#" + tooltipPrefix + "download"}/>
            <div className="duration">
              Max duration <strong>{props.max_duration ?? "???"} days</strong>
            </div>
            <div className="reliability">
              Reliability <strong>{props.reliability ?? "??"}%</strong>
            </div>
          </div>
          <div className="column column--rent">
            {priceRange.min && priceRange.min.price > 0 && priceRange.min.price !== priceRange.max?.price && (
              <div className="price">
                Min <strong>{priceRange.min.price} {priceRange.min.token_symbol}/{priceRange.min.unit}</strong>
              </div>
            )}
            {priceRange.max && priceRange.max.price > 0 && (
              <div className="price">
                {priceRange.min && priceRange.min.price !== priceRange.max?.price && "Max"} <strong>{priceRange.max.price} {priceRange.max.token_symbol}/{priceRange.max.unit}</strong>
              </div>
            )}
            <Button
              type="gradient"
              icon={<IconPlusCircle />}
              iconPosition="right"
              onClick={handleRentClick}
              disabled={selectedCard.length === 0 && options.length > 1}
            >
              Rent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
