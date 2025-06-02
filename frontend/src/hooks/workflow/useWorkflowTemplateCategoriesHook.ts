import React from "react";
import {useApi} from "@/providers/ApiProvider";
import useDebouncedEffect from "../useDebouncedEffect";
import { TWorkflowTemplateCategoryModel } from "@/models/workflowTemplate";

/**
 * Fetch a workflow template categories.
 */
export default function useWorkflowTemplateCategoriesHook() {
  const [initialized, setInitialized] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [loadingError, setLoadingError] = React.useState<null | string>(null);
  const [list, setList] = React.useState<TWorkflowTemplateCategoryModel[]>([]);
  const api = useApi();

  const refresh = React.useCallback((showLoading?: boolean) => {
    showLoading && setLoading(true);
    setLoadingError(null);

    const ar = api.call("getWorkflowTemplateCategories");

    ar.promise
      .then(async r => {
        if (ar.controller.signal.aborted) {
          return;
        }

        const data = await r.clone().json();

        if (r.ok) {
          setList(data);
        } else {
          setLoadingError("Failed to load workflow template categories");
        }
      })
      .catch(e => {
        if (ar.controller.signal.aborted) {
          return;
        }

        let msg = "An error occurred while loading workflow template categories";

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
  }, [api])

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
      list,
      refresh,
    }
  }, [
    initialized,
    loading,
    loadingError,
    list,
    refresh,
  ]);
}
