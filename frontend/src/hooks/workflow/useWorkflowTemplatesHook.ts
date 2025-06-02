import React from "react";
import { useApi } from "@/providers/ApiProvider";
import { randomString } from "@/utils/random";
import useDebouncedEffect from "../useDebouncedEffect";
import { TWorkflowTemplateModel } from "@/models/workflowTemplate";

export type TProps = {
  page?: number;
  category?: string;
  name?: string;
};

/**
 * Get workflow templates list
 *
 * @param {TProps} props
 */
export default function useWorkflowTemplatesHook(props: TProps = {
  page: 1,
}) {
  const [list, setList] = React.useState<TWorkflowTemplateModel[]>([]);
  const [initialized, setInitialized] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [loadingError, setLoadingError] = React.useState<null | string>(null);
  const [page, setPage] = React.useState<number>(props.page ?? 1);
  const [total, setTotal] = React.useState<number>(0);
  const [refreshKey, setRefreshKey] = React.useState(randomString());
  const api = useApi();

  const refresh = React.useCallback(() => {
    setRefreshKey(randomString());
  }, []);

  useDebouncedEffect(() => {
    setLoading(true);
    setLoadingError(null);

    const ar = api.call("getWorkflowTemplates", {
      query: new URLSearchParams({
        page: page.toString(),
        ...props.category ? {category: props.category} : {},
        ...props.name ? {name: props.name} : {},
      })
    });

    ar.promise
      .then(async r => {
        if (ar.controller.signal.aborted) {
          return;
        }

        const data = await r.json();

        if (r.ok) {
          setTotal(data["count"]);
          setList(data["list"]);
        } else {
          setLoadingError("Failed to load workflow templates list.")
        }
      })
      .catch(e => {
        if (ar.controller.signal.aborted) {
          return;
        }

        let msg = "An error occurred while loading workflow templates list.";

        if (e instanceof Error) {
          msg += " Error: "  + e.message + ".";
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
        setInitialized(true);
      })

    return () => {
      ar.controller.abort();
    }
  }, [api, page, refreshKey, props.category, props.name]);

  return React.useMemo(() => {
    return {
      list,
      initialized,
      loading,
      loadingError,
      page,
      setPage,
      total,
      refresh,
    }
  }, [
    list,
      initialized,
      loading,
      loadingError,
      page,
      total,
      refresh,
  ]);
}
