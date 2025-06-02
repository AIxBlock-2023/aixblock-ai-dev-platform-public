import React from "react";
import {useApi} from "@/providers/ApiProvider";
import {randomString} from "@/utils/random";
import {TOrdersResponseDTO, validateOrdersResponse} from "@/models/order";

export type TProps = {
  page?: number;
  pageSize?: number;
};

/**
 * Get all orders list
 *
 * @param {TProps} props
 */
export default function useAdminOrdersHook(
  props: TProps = {
    page: 1,
    pageSize: 10,
  }
) {
  const [list, setList] = React.useState<TOrdersResponseDTO["results"]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [loadingError, setLoadingError] = React.useState<null | string>(null);
  const [page, setPage] = React.useState<number>(props.page ?? 1);
  const [pageSize, setPageSize] = React.useState<number>(props.pageSize ?? 10);
  const [total, setTotal] = React.useState<number>(0);
  const [refreshKey, setRefreshKey] = React.useState(randomString());
  const [search, setSearch] = React.useState<string>("");
  const api = useApi();

  const refresh = React.useCallback(() => {
    setRefreshKey(randomString());
  }, []);

  React.useEffect(() => {
    setLoading(true);
    setLoadingError(null);

    const ar = api.call("adminOrders", {
      query: new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      }),
    });

    ar.promise
      .then(async (r) => {
        if (ar.controller.signal.aborted) {
          return;
        }
        const data = await r.json();
        // const data = sampleOrders;
        const vr = validateOrdersResponse(data);

        if (vr.isValid) {
        setList(data.results);
        setTotal(data.count);
        setLoadingError(null);
        } else {
          setLoadingError(
            "Invalid orders list received from the server. Please try again!"
          );

          if (window.APP_SETTINGS.debug) {
            console.error(vr);
          }
        }
      })
      .catch((e) => {
        if (ar.controller.signal.aborted) {
          return;
        }

        let msg = "An error occurred while loading orders list.";

        if (e instanceof Error) {
          msg += " Error: " + e.message + ".";
        }

        setLoadingError(msg + " Please try again!");

        if (window.APP_SETTINGS.debug) {
          console.error(e);
        }
      })
      .finally(() => {
        if (ar.controller.signal.aborted) {
          return;
        }

        setLoading(false);
      });

    return () => {
      ar.controller.abort();
    };
  }, [api, page, pageSize, refreshKey, search]);

  return React.useMemo(() => {
    return {
      list,
      loading,
      loadingError,
      page,
      setPage,
      pageSize,
      setPageSize,
      total,
      refresh,
      search,
      setSearch,
    };
  }, [list, loading, loadingError, page, pageSize, total, refresh, search, setSearch]);
}
