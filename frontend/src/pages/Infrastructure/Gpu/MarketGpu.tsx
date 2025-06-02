import GpuLayout from "./GpuLayout";
import {useInfrastructureProvider} from "../InfrastructureProvider";
import styles from "./Gpu.module.scss";
import ComputeList from "../Shared/ComputeList";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import {useNavigate} from "react-router-dom";
import React from "react";
import {IconPlus} from "@/assets/icons/Index";
import Button from "@/components/Button/Button";

export default function MarketGpu() {
  const {autoProvisionNode, marketGpu, rentedGpu: {refresh}} = useInfrastructureProvider();
  const navigate = useNavigate();

  return (
    <GpuLayout rightContent={(
      <>
        {autoProvisionNode}
        <Button onClick={() => navigate("/marketplace/computes")}>
          <IconPlus />
          Add GPUs/CPUs
        </Button>
      </>
    )}>
      {
        marketGpu.length > 0
          ? (
            <div className={styles.container}>
              <ComputeList list={marketGpu} refresh={refresh}/>
            </div>
          )
          : <EmptyContent message="(Empty list)" />
      }
    </GpuLayout>
  );
}
