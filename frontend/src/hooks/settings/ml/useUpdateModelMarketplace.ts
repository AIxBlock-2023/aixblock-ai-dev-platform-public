import { useCallback, useMemo, useState } from "react";
import { useApi } from "@/providers/ApiProvider";

export interface Gpus {
  compute_id: number;
  gpus_id?: string // if none using compute cpu
  machine_options?: string;
  rental_hours?: number;
}

export type TMarketplaceBody = {
  author_id?: number;
  is_buy_least?: boolean;
  project_id?: number;
  gpus?: Gpus[];
  cpus?: Gpus[];
};

export const useUpdateModelMarketplace = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Record<string, string[]> | null>(null);
  const [isUpdated, setIsUpdated] = useState(false);
  const api = useApi();

  const onUpdate = useCallback((body: TMarketplaceBody, id: number) => {
    setLoading(true);
    
    const ar = api.call("updateModelMarketplace", {
      params: { id: id.toString() },
      body: body
    });

    ar.promise
      .then(async (r) => {
        if (ar.controller.signal.aborted) return;
        const res = r.clone();
        const data = await res.json();
        if (data?.validation_errors) {
          setError(data?.validation_errors);
        } else {
          setIsUpdated(true);
          setError(null);
        }

        return r;
      })
      .catch((e) => {
        if (ar.controller.signal.aborted) {
          return;
        }

        let msg = "An error occurred while loading update model marketplace";

        if (e instanceof Error) {
          msg += " Error: " + e.message + ".";
          setError({ system: [msg] });
        }

        if (window.APP_SETTINGS.debug) {
          console.error(e);
        }
      })
      .finally(() => {
        if (ar.controller.signal.aborted) return;
        setLoading(false);
      });

    return ar;
  }, [api]);

  const onInstall = useCallback((body: TMarketplaceBody, id: number) => {
    setLoading(true);

    const ar = api.call("installModel", {
      params: { id: id.toString() },
      body: body
    });

    ar.promise
      .then(async (r) => {
        if (ar.controller.signal.aborted) return;
        const res = r.clone();
        const data = await res.json();
        if (data?.validation_errors) {
          setError(data?.validation_errors);
        } else {
          setIsUpdated(true);
          setError(null);
        }

        return r;
      })
      .catch((e) => {
        if (ar.controller.signal.aborted) {
          return;
        }

        let msg = "An error occurred while loading install model marketplace";

        if (e instanceof Error) {
          msg += " Error: " + e.message + ".";
          setError({ system: [msg] });
        }

        if (window.APP_SETTINGS.debug) {
          console.error(e);
        }
      })
      .finally(() => {
        if (ar.controller.signal.aborted) return;
        setLoading(false);
      });

    return ar;
  }, [api]);

  return useMemo(() => {
    return {
      loading,
      error,
      isUpdated,
      onUpdate,
      onInstall
    };
  }, [loading, error, isUpdated, onUpdate, onInstall]);
};
