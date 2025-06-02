import React from "react";
import {
  DISK_TYPES_LIST,
  GPUS_LIST,
  MACHINE_TYPES_LIST,
  PROVIDERS_LIST,
  SERVICES_LIST,
  TComputeMarketplaceV2Filter
} from "./types";
import InputBase from "@/components/InputBase/InputBase";
import Select, {SelectOption} from "@/components/Select/Select";
import COUNTRIES from "./countries.json";
import "./Filter.scss";
import TabSelect from "@/components/TabsSelect/TabSelect";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css"
import "react-calendar/dist/Calendar.css";
import Slider, {SliderProps} from "rc-slider";
import "rc-slider/assets/index.css";
import Checkbox from "@/components/Checkbox/Checkbox";
import {formatFloat} from "@/utils/customFormat";

dayjs.extend(customParseFormat);

type TProps = {
  filter: TComputeMarketplaceV2Filter;
  setFilter: React.Dispatch<React.SetStateAction<TComputeMarketplaceV2Filter>>;
}

const ANY_OPTION: SelectOption = {label: "-- Any --", value: ""};

function ComputesMarketplaceV2FilterGroup({children, title}: React.PropsWithChildren<{ title: string }>) {
  return (
    <fieldset className="p-computes-marketplace-v2-filter__group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  )
}

function ComputesMarketplaceV2FilterItem({children, label, emphasizeLabel}: React.PropsWithChildren<{
  label?: string | null,
  emphasizeLabel?: boolean,
}>) {
  return (
    <div className="p-computes-marketplace-v2-filter__item">
      {label && (
        <label>{emphasizeLabel ? <strong>{label}</strong> : label}</label>
      )}
      {children}
    </div>
  )
}

function ComputesMarketplaceV2FilterRange({children, from, to}: React.PropsWithChildren<{
  from: string | number,
  to: string | number,
}>) {
  return (
    <div className="p-computes-marketplace-v2-filter__range">
      <span className="p-computes-marketplace-v2-filter__range-from">{from}</span>
      <span className="p-computes-marketplace-v2-filter__range-to">{to}</span>
      {children}
    </div>
  )
}

export default function ComputesMarketplaceV2Filter({filter, setFilter}: TProps) {
  const locations = React.useMemo((): SelectOption[] => {
    return [
      ANY_OPTION,
      ...COUNTRIES.map(c => ({label: c.name, value: c.id.toString()})),
    ];
  }, []);

  const defaultLocation = React.useMemo((): SelectOption => {
    const country = COUNTRIES.find(c => filter.location?.id === c.id.toString());
    return country ? {label: country.name, value: country.id.toString()} : ANY_OPTION;
  }, [filter.location?.id]);

  const services = React.useMemo((): SelectOption[] => {
    // return [
    //   {label: SERVICES_LIST["model-training"], value: "model-training"},
    // ];
    return Object.keys(SERVICES_LIST).map(c => (
      {label: SERVICES_LIST[c as TComputeMarketplaceV2Filter["service_type"]], value: c}
    ));
  }, []);

  const defaultService = React.useMemo((): SelectOption => {
    return SERVICES_LIST.hasOwnProperty(filter.service_type)
      ? {label: SERVICES_LIST[filter.service_type], value: filter.service_type}
      : {label: SERVICES_LIST["label-tool"], value: "label-tool"};
  }, [filter.service_type]);

  const freeTime = React.useMemo((): [Date, Date] => {
    const from = filter.free_time.from.length > 0
        ? dayjs(filter.free_time.from, "DD/MM/YYYY")
        : dayjs();

    const to = filter.free_time.to.length > 0
        ? dayjs(filter.free_time.to, "DD/MM/YYYY")
        : dayjs();

    return [
      from.isValid() ? from.toDate() : new Date(),
      to.isValid() ? to.toDate() : new Date(),
    ];
  }, [filter.free_time.from, filter.free_time.to]);

  const createSliderTooltipRender = React.useCallback((suffix: string | ((v: number) => string) = "", prefix: string = "") => {
    const handler: Exclude<SliderProps["handleRender"], undefined> = (data) => {
      if (!data) {
        return <></>;
      }

      const value = data.props["aria-valuenow"] !== undefined
        ? typeof suffix === "function"
          ? suffix(data.props["aria-valuenow"])
          : prefix + (data.props["aria-valuenow"] ?? "") + suffix
        : "";

      return (
        <div {...data.props}>
          <div style={{
            fontSize: 12,
            left: data.props.className?.includes("handle-2") ? "" : 0,
            right: data.props.className?.includes("handle-1") ? "" : 0,
            position: "absolute",
            bottom: "calc(100% + 8px)",
            whiteSpace: "nowrap",
          }}>
            {value}
          </div>
        </div>
      );
    }

    return handler;
  }, []);

  return (
    <div className="p-computes-marketplace-v2-filter">

      <InputBase
        placeholder="Search name computes"
        value={filter.search}
        onBlur={e => setFilter(f => ({...f, search: e.target.value}))}
        onKeyUp={e => {
          if (e.key === "Enter") {
            setFilter(f => ({...f, search: e.currentTarget.value}))
          }
        }}
      />

      <ComputesMarketplaceV2FilterGroup title="Filter basic">
        <ComputesMarketplaceV2FilterItem label="Provider">
          <TabSelect
            tabs={PROVIDERS_LIST}
            value={filter.provider}
            onChange={(v: any) => setFilter(f => (
              {...f, provider: (v ?? "") as TComputeMarketplaceV2Filter["provider"]}
            ))}
          />
        </ComputesMarketplaceV2FilterItem>
        <div className="p-computes-marketplace-v2-filter__split">
          <ComputesMarketplaceV2FilterItem label="Location">
            <Select
              data={[{options: locations}]}
              classNameWidth="p-computes-marketplace-v2-filter__countries"
              defaultValue={defaultLocation}
              canFilter={true}
              onChange={e => {
                const country = COUNTRIES.find(c => e.value === c.id.toString());

                if (country) {
                  setFilter(f => ({...f, location: {...country, id: country.id.toString()}}));
                } else {
                  setFilter(f => ({...f, location: {id: "", alpha2: "", alpha3: "", name: ""}}));
                }
              }}
            />
          </ComputesMarketplaceV2FilterItem>
          <ComputesMarketplaceV2FilterItem label="Service">
            <Select
              data={[{options: services}]}
              classNameWidth="p-computes-marketplace-v2-filter__services"
              defaultValue={defaultService}
              onChange={e => {
                if (Object.keys(SERVICES_LIST).indexOf(e.value) > -1) {
                  setFilter(f => (
                    {...f, service_type: e.value as TComputeMarketplaceV2Filter["service_type"]}
                  ));
                } else {
                  setFilter(f => ({...f, service_type: "label-tool"}));
                }
              }}
            />
          </ComputesMarketplaceV2FilterItem>
        </div>
        <ComputesMarketplaceV2FilterItem label="# GPUs/machine">
          <TabSelect
            tabs={GPUS_LIST}
            value={filter.gpus_machine}
            onChange={(v: any) => setFilter(f => (
              {...f, gpus_machine: (v ?? "") as TComputeMarketplaceV2Filter["gpus_machine"]}
            ))}
          />
        </ComputesMarketplaceV2FilterItem>
        <div className="p-computes-marketplace-v2-filter__split">
          <ComputesMarketplaceV2FilterItem label="vCPUs per Model Training">
            <InputBase
              placeholder="vCPUs per Model Training"
              type="number"
              validateNonNegativeInteger={true}
              value={filter.vcpu_model_training}
              onBlur={e => setFilter(f => ({...f, vcpu_model_training: e.target.value}))}
            />
          </ComputesMarketplaceV2FilterItem>
          <ComputesMarketplaceV2FilterItem label="Disk Type">
            <TabSelect
              noPadding={true}
              isPrimaryColor={true}
              tabs={DISK_TYPES_LIST}
              value={filter.disk_type}
              onChange={(v: any) => setFilter(f => (
                {...f, disk_type: (v ?? "") as TComputeMarketplaceV2Filter["disk_type"]}
              ))}
            />
          </ComputesMarketplaceV2FilterItem>
        </div>
        <ComputesMarketplaceV2FilterItem label="Free time">
          <DateRangePicker
            onChange={(v: any) => {
              if (Array.isArray(v) && v.length === 2) {
                setFilter(f => ({
                  ...f,
                  free_time: {
                    from: v[0] instanceof Date ? dayjs(v[0]).format("DD/MM/YYYY") : "",
                    to: v[1] instanceof Date ? dayjs(v[1]).format("DD/MM/YYYY") : "",
                  },
                }));
              } else if (v instanceof Date) {
                setFilter(f => ({
                  ...f,
                  free_time: {
                    from: dayjs(v).format("DD/MM/YYYY"),
                    to: dayjs(v).format("DD/MM/YYYY"),
                  },
                }));
              } else {
                setFilter(f => ({...f, free_time: {from: "", to: ""}}));
              }
            }}
            value={freeTime}
            minDate={new Date()}
            showLeadingZeros={true}
            className="p-computes-marketplace-v2-filter__date-range"
            format="dd/MM/yyyy"
            locale="en-US"
          />
        </ComputesMarketplaceV2FilterItem>
      </ComputesMarketplaceV2FilterGroup>

      <ComputesMarketplaceV2FilterGroup title="Availability">
        <ComputesMarketplaceV2FilterItem>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={0}
              max={100}
              range
              value={filter.reliability === "" ? [0, 100] : [parseInt(filter.reliability.from), parseInt(filter.reliability.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, reliability: v[0] === 0 && v[1] === 100 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender("%")}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
      </ComputesMarketplaceV2FilterGroup>

      <ComputesMarketplaceV2FilterGroup title="Machine Options">
        {
          Object.keys(MACHINE_TYPES_LIST).map((mt, i) => {
            return (
              <ComputesMarketplaceV2FilterItem key={"machine-type-" + i}>
                <Checkbox
                  label={MACHINE_TYPES_LIST[mt as keyof typeof MACHINE_TYPES_LIST]}
                  checked={filter.machine_options.includes(mt as keyof typeof MACHINE_TYPES_LIST)}
                  onChange={(v: any) => {
                    if (v) {
                      setFilter(f => (
                        {...f, machine_options: [...filter.machine_options, mt as keyof typeof MACHINE_TYPES_LIST]}
                      ));
                    } else {
                      setFilter(f => (
                        {...f, machine_options: filter.machine_options.filter(o => o !== mt)}
                      ));
                    }
                  }}
                />
              </ComputesMarketplaceV2FilterItem>
            );
          })
        }
        <ComputesMarketplaceV2FilterItem label="Min Cuda Version (EG: 11.4)">
          <InputBase
            placeholder="E.g: 11.4"
            value={filter.cuda_version}
            onBlur={e => setFilter(f => ({...f, cuda_version: e.target.value}))}
          />
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="Driver Version (EG: 592.72.22)">
          <InputBase
            placeholder="E.g: 592.72.22"
            value={filter.driver_version}
            onBlur={e => setFilter(f => ({...f, driver_version: e.target.value}))}
          />
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="Ubuntu Version (EG: 22.04)">
          <InputBase
            placeholder="E.g: 22.04"
            value={filter.ubuntu_version}
            onBlur={e => setFilter(f => ({...f, ubuntu_version: e.target.value}))}
          />
        </ComputesMarketplaceV2FilterItem>
      </ComputesMarketplaceV2FilterGroup>

      <ComputesMarketplaceV2FilterGroup title="Price">
        <ComputesMarketplaceV2FilterItem>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={0}
              max={20}
              range
              value={filter.price === "" ? [0, 20] : [parseInt(filter.price.from), parseInt(filter.price.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, price: v[0] === 0 && v[1] === 20 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender()}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
      </ComputesMarketplaceV2FilterGroup>

      <ComputesMarketplaceV2FilterGroup title="Disk Size">
        <ComputesMarketplaceV2FilterItem>
          <ComputesMarketplaceV2FilterRange from={ "" } to={ "" }>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={ 40 }
              max={ 1900 }
              step={ 1 }
              defaultValue={
                filter.disk_size === ""
                  ? 40
                  : parseInt(filter.disk_size) > 1000
                    ? 1000 + (parseInt(filter.disk_size) - 1000) / 10
                    : parseInt(filter.disk_size)
              }
              onChange={ (v: any) => {
                setFilter(f => (
                  { ...f, disk_size: v > 1000 ? 1000 + (v - 1000) * 10 : v.toString() }
                ))
              } }
              handleRender={ createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(1 + (v - 1000) / 100) + " TB" : v + " GB";
              }) }
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
      </ComputesMarketplaceV2FilterGroup>

      <ComputesMarketplaceV2FilterGroup title="GPU Resources">
        <ComputesMarketplaceV2FilterItem label="GPU Count" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={0}
              max={8}
              range
              value={filter.gpu_count === "" ? [0, 8] : [parseInt(filter.gpu_count.from), parseInt(filter.gpu_count.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, gpu_count: v[0] === 0 && v[1] === 8 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender()}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="TFLOPs (total)" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={0}
              max={500}
              range
              value={filter.tflops === "" ? [0, 500] : [parseInt(filter.tflops.from), parseInt(filter.tflops.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, tflops: v[0] === 0 && v[1] === 500 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender()}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="Per GPU RAM" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={4000}
              range
              value={filter.per_gpu_ram === "" ? [0, 4000] : [parseInt(filter.per_gpu_ram.from), parseInt(filter.per_gpu_ram.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, per_gpu_ram: v[0] === 0 && v[1] === 4000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " TB" : v + " GB";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="GPU Total RAM" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={8000}
              range
              value={filter.gpu_total_ram === "" ? [0, 8000] : [parseInt(filter.gpu_total_ram.from), parseInt(filter.gpu_total_ram.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, gpu_total_ram: v[0] === 0 && v[1] === 8000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " TB" : v + " GB";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="GPU RAM Bandwidth" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={10}
              max={8000}
              range
              value={filter.gpu_ram_bandwidth === "" ? [0, 8000] : [parseInt(filter.gpu_ram_bandwidth.from), parseInt(filter.gpu_ram_bandwidth.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, gpu_ram_bandwidth: v[0] === 0 && v[1] === 8000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " TB/s" : v + " GB/s";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="PCIE Bandwidth" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={512000}
              range
              value={filter.pcie_bandwidth === "" ? [0, 512000] : [parseInt(filter.pcie_bandwidth.from), parseInt(filter.pcie_bandwidth.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, pcie_bandwidth: v[0] === 0 && v[1] === 512000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " GB/s" : v + " MB/s";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="NVLink Bandwidth" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={2000000}
              range
              value={filter.nvlink_bandwidth === "" ? [0, 2000000] : [parseInt(filter.nvlink_bandwidth.from), parseInt(filter.nvlink_bandwidth.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, nvlink_bandwidth: v[0] === 0 && v[1] === 2000000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000000 ? formatFloat(v / 1000000) + " TB/s" : (v > 1000 ? formatFloat(v / 1000) + " GB/s" : v + " MB/s");
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="Deep Learning Performance" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={8192}
              range
              value={filter.dlp_score === "" ? [1, 8192] : [parseInt(filter.dlp_score.from), parseInt(filter.dlp_score.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, dlp_score: v[0] === 1 && v[1] === 8192 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender()}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
      </ComputesMarketplaceV2FilterGroup>

      <ComputesMarketplaceV2FilterGroup title="Machine Resources">
        <ComputesMarketplaceV2FilterItem label="CPU Cores" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={512}
              range
              value={filter.cpu_cores === "" ? [0, 512] : [parseInt(filter.cpu_cores.from), parseInt(filter.cpu_cores.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, cpu_cores: v[0] === 0 && v[1] === 512 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender()}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="CPU RAM" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={10000}
              range
              value={filter.cpu_ram === "" ? [0, 10000] : [parseInt(filter.cpu_ram.from), parseInt(filter.cpu_ram.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, cpu_ram: v[0] === 0 && v[1] === 10000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " TB" : v + " GB";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="CPU GHZ" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={128}
              max={8000}
              range
              value={filter.cpu_ghz === "" ? [0, 8000] : [parseInt(filter.cpu_ghz.from), parseInt(filter.cpu_ghz.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, cpu_ghz: v[0] === 0 && v[1] === 8000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " GHz" : v + " MHz";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="Disk Bandwidth" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={128000}
              range
              value={filter.disk_bandwidth === "" ? [0, 128000] : [parseInt(filter.disk_bandwidth.from), parseInt(filter.disk_bandwidth.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, disk_bandwidth: v[0] === 0 && v[1] === 128000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " TB/s" : v + " MB/s";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="Inet Up" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={8000}
              range
              value={filter.inet_up === "" ? [0, 8000] : [parseInt(filter.inet_up.from), parseInt(filter.inet_up.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, inet_up: v[0] === 0 && v[1] === 8000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " Gbps" : v + " Mbps";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        <ComputesMarketplaceV2FilterItem label="Inet Down" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={1}
              max={8000}
              range
              value={filter.inet_down === "" ? [0, 8000] : [parseInt(filter.inet_down.from), parseInt(filter.inet_down.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, inet_down: v[0] === 0 && v[1] === 8000 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender(v => {
                return v > 1000 ? formatFloat(v / 1000) + " Gbps" : v + " Mbps";
              })}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>
        {/*<ComputesMarketplaceV2FilterItem label="# Open TCP/UDP Ports" emphasizeLabel={true}>
          <ComputesMarketplaceV2FilterRange from={""} to={""}>
            <Slider
              className="p-computes-marketplace-v2-filter__slider"
              min={0}
              max={65536}
              range
              value={filter.open_port === "" ? [0, 65536] : [parseInt(filter.open_port.from), parseInt(filter.open_port.to)]}
              onChange={(v: any) => {
                Array.isArray(v) && v.length === 2 && setFilter(f => (
                  {...f, open_port: v[0] === 0 && v[1] === 65536 ? "" : {from: v[0].toString(), to: v[1].toString()}}
                ))
              }}
              handleRender={createSliderTooltipRender()}
            />
          </ComputesMarketplaceV2FilterRange>
        </ComputesMarketplaceV2FilterItem>*/}
      </ComputesMarketplaceV2FilterGroup>

    </div>
);
}
