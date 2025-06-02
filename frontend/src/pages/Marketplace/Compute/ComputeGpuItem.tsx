import {TComputeMarketplaceV2GPU, TComputeMarketplaceV2SelectedOption} from "./types";
import ComputeItem from "./ComputeItem";
import {useMemo} from "react";
import {TProps as TComputeItemProps} from "./ComputeItem";
import {TOKEN_SYMBOL_DEFAULT} from "@/constants/projectConstants";

export type TProps = {
  data: TComputeMarketplaceV2GPU;
  onRent: (cards: TComputeMarketplaceV2SelectedOption[]) => void;
}

export default function ComputeGpuItem({data, onRent}: TProps) {
  const cards = useMemo(() => Object.keys(data), [data]);

  const firstCard = useMemo(() => {
    if (cards.length === 0 || data[cards[0]].length === 0) {
      return null;
    }

    return data[cards[0]][0];
  }, [cards, data]);

  const compute = useMemo(() => {
    if (cards.length === 0 || data[cards[0]].length === 0) {
      return null;
    }

    return data[cards[0]][0].compute_marketplace;
  }, [cards, data]);

  const gpus = useMemo(() => {
    const list: TComputeItemProps["gpus"] = [];

    cards.forEach(cardName => {
      data[cardName].forEach(card => {
        let isFound = false;
        const cardPrice = card.prices.length > 0 ? card.prices[0].price : 0;
        const cardUnit = card.prices.length > 0 ? card.prices[0].unit : "hour";
        const cardTokenSymbol = card.prices.length > 0 ? card.prices[0].token_symbol : TOKEN_SYMBOL_DEFAULT;

        for (let i = 0; i < list.length; i++) {
          if (list[i].name === cardName && list[i].price.toString() === cardPrice.toString()) {
            list[i]["ids"].push(card.id);
            isFound = true;
            break;
          }
        }

        if (!isFound) {
          list.push({
            id: card.id,
            vast_contract_id: card.vast_contract_id,
            provider_name: card.provider_name,
            name: cardName,
            price: cardPrice,
            unit: cardUnit.toString(),
            token_symbol: cardTokenSymbol,
            ids: [card.id],
          });
        }
      });
    });

    return list;
  }, [cards, data]);

  const specs = useMemo((): TComputeMarketplaceV2SelectedOption["specs"] => {
    let config: {[k: string]: string} = {};

    if (typeof compute?.config === "object") {
      config = compute.config as unknown as {[k: string]: string};
    } else {
      try {
        config = JSON.parse(compute?.config ?? "{}");
      } catch (e) {
        if (window.APP_SETTINGS.debug) {
          console.error(e);
        }
      }
    }

    return {
      os: "os" in config ? config["os"] : null,
      ram: "ram" in config ? parseInt(config["ram"]) / 1024 : null,
      diskSize: "disk" in config ? config["disk"] : null,
      diskType: "diskType" in config ? config["diskType"] : null,
      cpu: "cpu" in config ? config["cpu"] : null,
    };
  }, [compute?.config]);

  if (cards.length === 0 || !compute) {
    return null;
  }

  return (
    <ComputeItem
      num_gpus={firstCard?.num_gpus ?? 1}
      compute_id={compute.id}
      datacenter={firstCard?.datacenter}
      location={firstCard?.location_name}
      machine_type={firstCard?.machine_options}
      service={(compute.compute_type ?? "full").toUpperCase()}
      gpus={gpus}
      gpu_tflops={firstCard?.gpu_tflops}
      max_cuda_version={firstCard?.max_cuda_version}
      per_gpu_ram={firstCard?.machine_options === "physical-machines" ? firstCard?.gpu_memory :firstCard?.per_gpu_ram}
      per_gpu_memory_bandwidth={firstCard?.per_gpu_memory_bandwidth}
      motherboard={firstCard?.motherboard}
      number_of_pcie_per_gpu={firstCard?.number_of_pcie_per_gpu}
      cpu={specs.cpu ?? compute.name}
      eff_out_of_total_nu_of_cpu_virtual_cores={firstCard?.eff_out_of_total_nu_of_cpu_virtual_cores}
      eff_out_of_total_system_ram={firstCard?.eff_out_of_total_system_ram}
      internet_down_speed={firstCard?.internet_down_speed}
      internet_up_speed={firstCard?.internet_up_speed}
      max_duration={firstCard?.max_duration}
      reliability={firstCard?.reliability}
      onRent={onRent}
      os={specs.os}
      ram={specs.ram}
      diskSize={specs.diskSize}
      diskType={specs.diskType}
      provider_id={firstCard?.provider_id}
    />
  );
}
