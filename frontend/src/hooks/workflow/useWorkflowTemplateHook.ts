import React from "react";
import {useApi} from "@/providers/ApiProvider";
import useDebouncedEffect from "../useDebouncedEffect";
import { TWorkflowTemplateModel } from "@/models/workflowTemplate";

/**
 * Fetch a workflow template information.
 */
export default function useWorkflowTemplateHook(id: string) {
  const [initialized, setInitialized] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [loadingError, setLoadingError] = React.useState<null | string>(null);
  const [detail, setDetail] = React.useState<TWorkflowTemplateModel | null>(null);
  const api = useApi();

  const refresh = React.useCallback((showLoading?: boolean) => {
    if (!id) {
      return;
    }

    showLoading && setLoading(true);
    setLoadingError(null);

    const ar = api.call("getWorkflowTemplateDetail", {
      params: {id}
    });

    ar.promise
      .then(async r => {
        if (ar.controller.signal.aborted) {
          return;
        }

        const data = await r.clone().json();

        if (r.ok) {
          setDetail(data);
        } else {
          setLoadingError("Failed to load workflow template " + id);
        }
      })
      .catch(e => {
        if (ar.controller.signal.aborted) {
          return;
        }

        let msg = "An error occurred while loading workflow template " + id + ".";

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

        showLoading && setLoading(false);
        setInitialized(true);
      });

    return ar;
  }, [api, id])

  useDebouncedEffect(() => {
    const ar = refresh();
    ar?.promise.catch(() => {});

    return () => {
      ar?.controller.abort("Unmounted");
    }
  }, [refresh]);

  return React.useMemo(() => {
    return {
      initialized,
      loading,
      loadingError,
      detail,
      setDetail,
      refresh,
    }
  }, [
    initialized,
    loading,
    loadingError,
    detail,
    refresh,
    setDetail,
  ]);
}
