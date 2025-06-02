import React, {useMemo, useState} from "react";
import {useApi} from "@/providers/ApiProvider";
import {
  TComputeMarketplaceV2CPU,
  TComputeMarketplaceV2Filter,
  TComputeMarketplaceV2GPU,
  TComputeMarketplaceV2Results,
} from "./types";
import {randomString} from "@/utils/random";
import useDebouncedEffect from "@/hooks/useDebouncedEffect";

export type TProps = {
  initialPage?: number,
  initialPageSize?: number,
}

export default function useComputesMarketplace(
  filter: TComputeMarketplaceV2Filter,
  {
    initialPage,
    initialPageSize,
  }: TProps,
) {
  const {call} = useApi();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage ?? 1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize ?? 20);
  const [total, setTotal] = React.useState<number>(0);
  const [listGpu, setListGpu] = React.useState<TComputeMarketplaceV2GPU[]>([]);
  const [listCpu, setListCpu] = React.useState<TComputeMarketplaceV2CPU[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(randomString());

  const refresh = React.useCallback(() => {
    setRefreshKey(randomString());
  }, []);

  useDebouncedEffect(() => {
    setLoading(true);
    setError(null);

    const ar = call("listComputesMarketplaceV2", {
      body: {
        ...filter,
        page: page,
        page_size: pageSize,
      },
    });

    ar.promise
      .then(async r => {
        if (ar.controller.signal.aborted) {
          return;
        }

        if (!r.ok) {
          throw new Error("Response error. Code: " + r.status);
        }

        const data = await r.json();
        setTotal(data["count"]);

        const results: TComputeMarketplaceV2Results = data["results"];
        const gpus: Array<TComputeMarketplaceV2GPU> = []
        const cpus: Array<TComputeMarketplaceV2CPU> = []

        results.forEach(item => {
          if ("compute" in item) {
            gpus.push(...item["compute"]);
          } else if ("compute_cpu" in item) {
            cpus.push(...item["compute_cpu"]);
          }
        });

        setListGpu(gpus);
        setListCpu(cpus);
      })
      .catch(e => {
        if (ar.controller.signal.aborted) {
          return;
        }

        if (e instanceof Error) {
          setError(e.message);
        }
      })
      .finally(() => {
        if (ar.controller.signal.aborted) {
          return;
        }

        setLoading(false);
      });

    return () => {
      ar.controller.abort("Unmounted");
    }
  }, [call, filter, page, pageSize, refreshKey]);

  return useMemo(() => ({
    loading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    refresh,
    listGpu,
    listCpu,
  }), [
    loading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    refresh,
    listGpu,
    listCpu,
  ])
}
