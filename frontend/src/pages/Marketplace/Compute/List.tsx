import {TComputeMarketplaceV2CPU, TComputeMarketplaceV2GPU, TComputeMarketplaceV2SelectedOption} from "./types";
import "./List.scss";
import ComputeGpuItem from "./ComputeGpuItem";
import ComputeCpuItem from "./ComputeCpuItem";

type TProps = {
  listGpu: TComputeMarketplaceV2GPU[];
  listCpu: TComputeMarketplaceV2CPU[];
  onRent: (cards: TComputeMarketplaceV2SelectedOption[]) => void;
}

export default function ComputesMarketplaceV2List({listGpu, listCpu, onRent}: TProps) {
  return (
    <div className="p-computes-marketplace-v2-list">
      {
        listGpu.map((c, idx) => {
          return (
            <ComputeGpuItem
              key={"compute-gpu-" + idx}
              data={c}
              onRent={onRent}
            />
          );
        })
      }
      {
        listCpu.map((c, idx) => {
          return (
            <ComputeCpuItem
              key={"compute-cpu-" + idx}
              data={c}
              onRent={onRent}
            />
          );
        })
      }
    </div>
  );
}
