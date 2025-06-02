import {TComputeMarketplaceRentedCard} from "@/hooks/computes/useRentedGpu";
import {formatFloat} from "@/utils/customFormat";
import dayjs from "dayjs";
import React, { useCallback, useEffect } from "react";
import {confirmDialog} from "@/components/Dialog";
import RentedComputeItem from "./RentedComputeItem";
import styles from "./ComputeList.module.scss";
import {useDeleteCompute} from "@/hooks/computes/useDeleteCompute";
import {toastError, toastSuccess} from "@/utils/toast";
import { useNotification } from "@/providers/NotificationProvider";
import { useApi } from "@/providers/ApiProvider";
import { useNavigate } from "react-router-dom";
import SolanaRpcParticle from "@/solanaRPCParticle";
import {
  type SolanaChain,
  useAccount,
  usePublicClient,
  useWallets,
} from "@particle-network/connectkit";

export type TProps = {
  list: TComputeMarketplaceRentedCard[];
  refresh: () => Promise<void> | void;
}

export default function ComputeList({list, refresh}: TProps) {
  const deleteCompute = useDeleteCompute();
  const {showComputeNotifications, markNotificationAsRead} = useNotification();
  const api = useApi();
  const navigate = useNavigate();

  const { isConnected: connectedParticle, chainId, address } = useAccount();
  const [primaryWallet] = useWallets();
  const solanaWallet = primaryWallet?.getWalletClient<SolanaChain>();
  const publicClient = usePublicClient<SolanaChain>();

  const onDeleteComputeCrypto = async (historyId: number) => {
    confirmDialog({
      message: "Are you sure you want to delete this compute? You must confirm the transaction via Particle to receive the refund.",
      async onSubmit() {
        if (!solanaWallet || !publicClient || !connectedParticle || !chainId || !address) {
          toastError(
            "Wallet is not connected yet. Please connect your wallet."
          );
          navigate("/user/wallet");
          return;
        }
        try {
          const rpc = new SolanaRpcParticle(chainId);

          if (!address) {
            toastError("Invalid address. Please re-connect your wallet.");
            return;
          }

          const ar = api.call("deleteRentedGpuCrypto", {
            body: {
              history_id: historyId,
              walletAddress: address,
            },
          });
          const r = await ar.promise;
          if (!r.ok) {
            toastError("Send transaction error");
          }
          const data = await r.json();
          await rpc.signAndSendTransaction(data, solanaWallet);
          toastSuccess("Send transaction successfully");
          refresh();
        } catch (error) {
          refresh();
          console.log(error);
          toastError("Send transaction error");
          return;
        }
      },
    });
  };

  const onDeleteCompute = useCallback((id: number, infrastructure_id?: number | string | null) => {
    confirmDialog({
      message: "Are you sure you want to delete this compute?",
      onSubmit() {
        deleteCompute.delete(id, undefined, infrastructure_id).promise
          .then(r => {
            if (!r.ok) return;
            refresh();
          });
      },
    });
  }, [deleteCompute, refresh]);

  useEffect(() => {
    if (!deleteCompute.error) return;
    toastError(deleteCompute.error);
  }, [deleteCompute.error]);

  return (
    <div className={styles.container}>
      {list.map(item => {
        let config: any = {};

        try {
          if (typeof (item.compute_marketplace.config === 'object')) {
            config = (item.compute_marketplace.config ?? "{}");
          } else {
            config = JSON.parse(item.compute_marketplace.config ?? "{}");
          }
        } catch (e) {
          if (window.APP_SETTINGS.debug) {
            console.error(e);
          }
        }

        const specs: { cpu: string | null } = {
          cpu: config.hasOwnProperty("cpu") && config.cpu ? config.cpu : null,
        };

        let price = null;

        if (item.compute_marketplace.is_using_cpu) {
          price = item.compute_marketplace.cpu_price;
        } else if (item.prices) {
          price = "$" + item.prices.price;
        }

        const ip = (item.compute_marketplace.ip_address ? item.compute_marketplace.ip_address : "??") + ":" + item.compute_marketplace.port;

        return (
          <RentedComputeItem
            infrastructure_id={item.compute_marketplace?.infrastructure_id}
            key={"compute-" + item.id}
            install_logs={item.install_logs}
            compute_id={item.compute_marketplace.id}
            datacenter={item.compute_gpu?.datacenter}
            location={item.compute_gpu?.location_name ?? item.compute_marketplace?.location_name}
            machine_type="Virtual Machine"
            service={(item.service_type ?? "full").toUpperCase()}
            gpu_tflops={item.compute_gpu?.gpu_tflops}
            max_cuda_version={item.compute_gpu?.max_cuda_version}
            per_gpu_ram={item.compute_gpu?.gpu_memory}
            per_gpu_memory_bandwidth={item.compute_gpu?.gpu_memory_bandwidth}
            motherboard={item.compute_gpu?.motherboard}
            number_of_pcie_per_gpu={item.compute_gpu?.number_of_pcie_per_gpu}
            cpu={specs.cpu}
            eff_out_of_total_nu_of_cpu_virtual_cores={item.compute_gpu?.eff_out_of_total_nu_of_cpu_virtual_cores}
            eff_out_of_total_system_ram={item.compute_gpu?.eff_out_of_total_system_ram}
            internet_down_speed={item.compute_gpu?.internet_down_speed}
            internet_up_speed={item.compute_gpu?.internet_up_speed}
            source={item.type}
            rentingHours={formatFloat(dayjs().diff(dayjs(item.time_start), "hour", true))}
            remainingHours={formatFloat(dayjs(item.time_end).diff(dayjs(), "hour", true))}
            price={price}
            ip={ip}
            provider_id={item.provider_id}
            name={item.compute_marketplace.is_using_cpu ? config?.name : item.compute_gpu?.gpu_name}
            installStatus={item.compute_install ?? null}
            onDeleteCompute={onDeleteCompute}
            onDeleteComputeCrypto={onDeleteComputeCrypto}
            onNotificationClick={() => showComputeNotifications(item.id, async (list) => {
              if (list.length === 0 || item.new_notifications_count === 0) {
                return;
              }

              await Promise.all(list.map(n => markNotificationAsRead(n.id)));
              refresh();
            })}
            type={item.compute_marketplace.type}
            schema={item.schema}
            history_id={item.id}
            new_notification_count={item.new_notifications_count}
            payment_method={item.payment_method}
          />
        );
      })}
    </div>
  );
}
