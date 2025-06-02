import { useCallback, useMemo, useState } from "react";
import { TApiCallResult, useApi } from "@/providers/ApiProvider";
import {
  SERVICES_LIST,
  TComputeMarketplaceV2Status,
  TComputeMarketplaceV2Type
} from "@/pages/ComputesMarketplaceV2/types";
import useDebouncedEffect from "../useDebouncedEffect";

export type TComputeInstallStatus = "failed" | "completed" | "installing"| "wait_verify"| "wait_crypto" | null;

export type TComputeGPU = {
  id: number;
  gpu_name?: string | null;
  power_consumption?: string | null;
  memory_usage?: string | null;
  power_usage?: string | null;
  gpu_index: number;
  gpu_memory?: string | null;
  memory?: string | null;
  gpu_memory_usage?: string | null;
  gpu_memory_bandwidth?: string | null;
  motherboard?: string | null;
  internet_up_speed?: number | null;
  internet_down_speed?: number | null;
  number_of_pcie_per_gpu?: string | null;
  per_gpu_pcie_bandwidth?: string | null;
  eff_out_of_total_nu_of_cpu_virtual_cores?: string | null;
  eff_out_of_total_system_ram?: string | null;
  max_cuda_version?: number | null;
  driver_version?: number | null;
  reliability?: number | null;
  dl_performance_score?: number | null;
  dlp_score?: number | null;
  location_id?: number | null;
  location_alpha2?: string | null;
  location_name?: string | null;
  gpu_tflops?: string | null;
  datacenter?: string | null;
  branch_name?: string | null;
  batch_size?: number | null;
  gpu_id?: string | null;
  serialno?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  quantity_used?: number | null;
  user_rented?: number | null;
  max_user_rental?: number | null;
  status?: "created" | "completed" | "renting" | "pending" | "suspend" | "in_marketplace" | "underperformance" | "failed" | null;
  owner_id?: number | null;
  compute_marketplace: number;
}

type TComputeMarketplaceRentedCPU = {
  config?: string | null;
  id: number;
  cpu_price?: string | null;
  name: string;
  infrastructure_id: string;
  ip_address: string;
  port: string;
  is_using_cpu?: boolean | null;
  status: TComputeMarketplaceV2Status;
  type: TComputeMarketplaceV2Type;
  compute_type?: string | null;
  location_name?: string;
}


export type TComputeMarketplaceRentedCard = {
  id: number;
  compute_marketplace: TComputeMarketplaceRentedCPU;
  compute_gpu: TComputeGPU;
  prices?: {
    id: number;
    token_symbol: string;
    price: number;
    unit: string;
    type: string;
    compute_gpu_id: number;
    compute_marketplace_id: number;
    model_marketplace_id?: number | null;
  } | null;
  time_start: string;
  rental_hours?: number | null;
  time_end?: string | null;
  install_logs?: string | null;
  order_id?: number | null;
  date: string;
  status?: "renting" | "completed" | null;
  type?: "rent_marketplace" | "own_not_leasing" | "leasing_out" | null;
  compute_install?: TComputeInstallStatus;
  service_type?: keyof typeof SERVICES_LIST | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  quantity_used?: number | null;
  account: number;
  provider_id?: number | null;
  schema?: string | null;
  new_notifications_count: number;
  payment_method?: string | null;
  is_from_master_node?: boolean
};

export type TRentedGpuResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TComputeMarketplaceRentedCard[];
};

type TProps = {
  page?: number;
  pageSize?: number;
  search?: string | null;
  fieldSearch?: string | null;
  sort?: string | null;
  type?: string | null;
  getAll?: boolean;
  status?: string | null;
  valueQuery?: string | null;
  fieldQuery?: string | null;
};

export function getRentedGpuStatusText(t: TComputeMarketplaceRentedCard["type"]) {
  switch (t) {
    case "rent_marketplace":
      return "From Marketplace";
    case "own_not_leasing":
      return "Self-Hosted";
    case "leasing_out":
      return "Leasing Out";
    default:
      return "Other";
  }
}

export const useRentedGpu = (
  props: TProps = {
    page: 1,
    pageSize: 9,
    search: null,
    fieldSearch: null,
    sort: null,
    type: null,
    fieldQuery: null,
    valueQuery: null
  }
) => {
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(props.page ?? 1);
  const [pageSize, setPageSize] = useState<number>(props.pageSize ?? 9);
  const [list, setList] = useState<TRentedGpuResponse | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);

    const query = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      sort: "compute_install-asc,id-desc",
    });

    query.append("fieldSearch", props.fieldSearch ?? "all");

    if (props.search) {
      query.append("search", props.search);
    }

    if (props.sort) {
      query.append("sort", props.sort);
    }

    if (props.type) {
      query.append("type", props.type);
    }
    if (props.fieldQuery) {
      query.append("fieldQuery", props.fieldQuery);
    }
    if (props.valueQuery) {
      query.append("valueQuery", props.valueQuery);
    }
    const response: TApiCallResult = api.call("listRentedGpu", {
      query,
    });

    try {
      const res = await response.promise;

      if (response.controller.signal.aborted) {
        return;
      }

      if (res.ok) {
        const data: TRentedGpuResponse = await res.json();
        setList(data);
        setError(null);
      } else {
        let error = "Error: " + res.status + " - " + res.statusText;

        try {
          const data = await res.json();

          if ("detail" in data) {
            error += " / Detail: " + data.detail;
          }
        } catch {
        }

        setError(error);
      }
    } catch (e) {
      if (response.controller.signal.aborted) {
        return;
      }

      let msg = "An error occurred while loading rented GPUs";

      if (e instanceof Error) {
        msg += " Error: " + e.message + ".";
        setError(msg);
      }
    }

    setLoading(false);
    setInitialized(true);
  }, [page, pageSize, props.fieldSearch, props.search, props.sort, props.type, props.fieldQuery, props.valueQuery, api]);

  useDebouncedEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => {
    return {
      loading,
      error,
      list,
      page,
      pageSize,
      setPage,
      setPageSize,
      refresh,
      initialized,
    };
  }, [loading, error, list, page, pageSize, refresh, initialized]);
};
