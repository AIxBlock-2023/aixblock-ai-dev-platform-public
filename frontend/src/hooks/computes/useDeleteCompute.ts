import {useCallback, useMemo, useState} from "react";
import {useApi} from "@/providers/ApiProvider";
import {extractErrorMessage, extractErrorMessageFromResponse, unexpectedErrorMessage} from "@/utils/error";

export const useDeleteCompute = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const deleteCompute = useCallback((id: number, project_id?: number, infrastructure_id?: number | string | null) => {
    setLoading(true);
    setError(null);

    const ar = api.call("deleteRentedGpu", {
      params: {id: id.toString()},
      query: new URLSearchParams({
        project_id: project_id?.toString() || "",
        infrastructure_id: infrastructure_id?.toString() || ""
      }),
    });

    ar.promise
      .then(async r => {
        if (!r.ok) {
          setError(await extractErrorMessageFromResponse(r));
        }

        return r;
      })
      .catch(e => {
        if (ar.controller.signal.aborted) return;
        if (window.APP_SETTINGS.debug) console.error(e);
        setError(extractErrorMessage(e) ?? unexpectedErrorMessage(e));
      })
      .finally(() => {
        if (ar.controller.signal.aborted) return;
        setLoading(false);
      });

    return ar;
  }, [api]);

  return useMemo(() => ({
    loading,
    error,
    delete: deleteCompute,
  }), [deleteCompute, error, loading])
};
