import {TComputeMarketplaceV2CPU, TComputeMarketplaceV2SelectedOption} from "./types";
import ComputeItem from "./ComputeItem";
import {useMemo} from "react";

export type TProps = {
  data: TComputeMarketplaceV2CPU;
  onRent: (cards: TComputeMarketplaceV2SelectedOption[]) => void;
}

export default function ComputeCpuItem({data, onRent}: TProps) {
  const specs = useMemo((): TComputeMarketplaceV2SelectedOption["specs"] => {
    let config: {[k: string]: string} = {};

    try {
      config = JSON.parse(data.config ?? "{}");
    } catch (e) {
      if (window.APP_SETTINGS.debug) {
        console.error(e);
      }
    }

    return {
      os: "os" in config ? config["os"] : null,
      ram: "ram" in config ? parseInt(config["ram"]) / 1024 : null,
      diskSize: "disk" in config ? config["disk"] : null,
      diskType: "diskType" in config ? config["diskType"] : null,
      cpu: "cpu" in config ? config["cpu"] : null,
    };
  }, [data.config]);

  return (
    <ComputeItem
      compute_id={data.id}
      datacenter={data.datacenter}
      location={data.location_name}
      machine_type={null}
      service={(data.compute_type ?? "full").toUpperCase()}
      gpus={[{
        id: data.id,
        name: data.name,
        price: data.cpu_price.price,
        token_symbol: data.cpu_price.token_symbol,
        unit: data.cpu_price.unit,
        ids: [data.id],
        vast_contract_id: -1,
        provider_name: "",
      }]}
      gpu_tflops={"0"}
      max_cuda_version={0}
      per_gpu_ram={"-"}
      per_gpu_memory_bandwidth={"-"}
      motherboard={data.motherboard}
      number_of_pcie_per_gpu={data.number_of_pcie_per_gpu}
      cpu={specs.cpu}
      eff_out_of_total_nu_of_cpu_virtual_cores={data.eff_out_of_total_nu_of_cpu_virtual_cores}
      eff_out_of_total_system_ram={data.eff_out_of_total_system_ram}
      internet_down_speed={data.internet_down_speed}
      internet_up_speed={data.internet_up_speed}
      max_duration={data.max_duration}
      reliability={data.reliability}
      onRent={onRent}
      os={specs.os}
      ram={specs.ram}
      diskSize={specs.diskSize}
      diskType={specs.diskType}
      provider_id={data.provider_id}
    />
  );
}
