import AdminLayout from "@/pages/Admin/Layout";
import useAdminOrdersHook from "@/hooks/orders/useAdminOrdersHook";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import Pagination from "@/components/Pagination/Pagination";
import React, {useCallback} from "react";
import Table, {TableActions} from "@/components/Table/Table";
import {TOrder} from "@/models/order";
import UserName from "@/components/UserName/UserName";
import {formatDateTime} from "@/utils/formatDate";
import {infoDialog} from "@/components/Dialog";
import RentedComputeItem from "@/pages/Flow/Shared/CPU/RentedComputeItem";
import IconCpu from "@/assets/icons/IconCpu";
import styles from "./AdminOrder.module.scss";
import { formatFloat } from "@/utils/customFormat";
import dayjs from "dayjs";

export default function AdminOrders() {
  const {list, page, setPage, pageSize, loading, loadingError, total, refresh} = useAdminOrdersHook();

  const showCompute = useCallback((o: TOrder) => {
    // if (!o.gpu_info || !o.history_order) {
    //   toastError("Compute information does not exist in order #" + o.id);
    //   return;
    // }

    infoDialog({
      title: "Order #" + o.id,
      message: (
        <div className={styles.cpuItem}>
          {o.compute_gpus.map((gpu) => {

            const usingHours = formatFloat(dayjs().diff(dayjs(gpu.history_order.time_start), "hour", true));
            const timeEnd = formatFloat(dayjs(gpu.history_order.time_end).diff(dayjs(), "hour", true));
            const rentalHours = gpu.history_order.rental_hours;

            const rentingHours = Number(usingHours) > rentalHours ? rentalHours : usingHours;
            const remainingHours = Number(timeEnd) < 0 ? 0 : timeEnd;

            const ip_address = (gpu.compute_marketplace?.ip_address ? gpu.compute_marketplace.ip_address : "??") + ":" + gpu.compute_marketplace.port;

            return (
              <RentedComputeItem
                compute_id={gpu.compute_marketplace.id ?? 0}
                history_id={gpu.history_order?.id ?? 0}
                datacenter={gpu.datacenter}
                price={o.price + " " + o.unit}
                provider_id={gpu.provider_id ?? 0}
                name={gpu.gpu_name}
                type={gpu.history_order?.type}
                eff_out_of_total_nu_of_cpu_virtual_cores={gpu.eff_out_of_total_nu_of_cpu_virtual_cores}
                eff_out_of_total_system_ram={gpu.eff_out_of_total_system_ram}
                gpu_tflops={gpu.gpu_tflops}
                internet_down_speed={gpu.internet_down_speed}
                internet_up_speed={gpu.internet_up_speed}
                rentingHours={rentingHours}
                remainingHours={remainingHours}
                location={gpu.location_name}
                ip={ip_address}
                max_cuda_version={gpu.max_cuda_version as unknown as number}
                number_of_pcie_per_gpu={gpu.number_of_pcie_per_gpu}
                motherboard={gpu.motherboard}
                per_gpu_memory_bandwidth={gpu.gpu_memory_bandwidth}
                per_gpu_ram={gpu.gpu_memory}
                machine_type={gpu.machine_options}
                service={gpu.history_order?.service_type}
                source={gpu.history_order?.type as "rent_marketplace" | "own_not_leasing" | "leasing_out" | null | undefined}
                payer_email={o.payer_email}
                payer_full_name={o.payer_full_name}
                installStatus={gpu.history_order.compute_install}
                deleted_at={gpu.history_order.deleted_at}
              />
            )
          })}
        </div>
      )
    })
  }, []);

  return (
    <AdminLayout
      title="Orders"
    >
      {loading
        ? <EmptyContent message="Getting orders..." />
        : loadingError
          ? (
            <EmptyContent
              message={loadingError}
              buttons={[
                {children: "Retry", onClick: refresh},
              ]}
            />
          )
          : (
            <>
              <Table
                columns={[
                  {label: "ID", dataKey: "id"},
                  {label: "Amount", dataKey: "total_amount"},
                  {label: "Unit", dataKey: "unit"},
                  {
                    label: "User",
                    renderer: (o: TOrder) => {
                      return <UserName userID={o.user} />;
                    },
                  },
                  {
                    label: "Date",
                    renderer: (o: TOrder) => {
                      return formatDateTime(o.created_at);
                    },
                  },
                  {
                    renderer: (o: TOrder) => {
                      if (o.compute_gpus.length) {
                        return <TableActions actions={[
                          {icon: <IconCpu />, onClick: () => showCompute(o)}
                        ]} />
                      }
                    },
                  },
                ]}
                data={list}
              />
              <Pagination
                total={total}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                target="admin/orders"
              />
            </>
          )
      }
    </AdminLayout>
  )
}
