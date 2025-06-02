import {
  TComputeMarketplaceRentedCard,
  useRentedGpu,
} from "@/hooks/computes/useRentedGpu";
import React from "react";
import AutoProvision from "@/components/AutoProvision/AutoProvision";
import { useCentrifuge } from "@/providers/CentrifugoProvider";
import { confirmDialog } from "@/components/Dialog";
import { useNavigate } from "react-router-dom";
import { useListGlobalStorage } from "@/hooks/settings/cloudStorage/useListGlobalStorage";
import { useNotification } from "@/providers/NotificationProvider";
import { useWorkflows } from "@/providers/WorkflowsProvider";

export type TInfrastructureProvider = {
  rentedGpu: ReturnType<typeof useRentedGpu>;
  globalStorages: ReturnType<typeof useListGlobalStorage>;
  selfHostedPlatform: TComputeMarketplaceRentedCard[];
  selfHostStorage: TComputeMarketplaceRentedCard[];
  marketGpu: TComputeMarketplaceRentedCard[];
  selfHostGpu: TComputeMarketplaceRentedCard[];
  autoProvisionNode?: React.ReactNode;
};

export const InfrastructureContext =
  React.createContext<TInfrastructureProvider>({
    rentedGpu: {
      initialized: true,
      refresh: () => new Promise(() => void 0),
      page: 1,
      pageSize: 100,
      error: null,
      loading: false,
      list: null,
      setPage: () => void 0,
      setPageSize: () => void 0,
    },
    globalStorages: {
      initialized: true,
      refresh: () => void 0,
      list: [],
      loading: false,
      error: null,
    },
    selfHostedPlatform: [],
    selfHostStorage: [],
    marketGpu: [],
    selfHostGpu: [],
  });

export default function InfrastructureProvider({
  children,
}: React.PropsWithChildren) {
  const rentedGpu = useRentedGpu({ pageSize: 1000 });
  const { onMessage } = useCentrifuge();
  const navigate = useNavigate();
  const globalStorages = useListGlobalStorage();
  const { playSound } = useNotification();
  const { callbackUrl, navigateToCallback } = useWorkflows();

  const selfHostedPlatform = React.useMemo(() => {
    return (
      rentedGpu.list?.results?.filter((c) => c.service_type === "label-tool") ??
      []
    );
  }, [rentedGpu.list?.results]);

  const selfHostStorage = React.useMemo(() => {
    return (
      rentedGpu.list?.results?.filter((c) => c.service_type === "storage") ?? []
    );
  }, [rentedGpu.list?.results]);

  const marketGpu = React.useMemo(() => {
    return (
      rentedGpu.list?.results?.filter(
        (c) =>
          c.service_type === "model-training" && c.type === "rent_marketplace"
      ) ?? []
    );
  }, [rentedGpu.list?.results]);

  const selfHostGpu = React.useMemo(() => {
    return (
      rentedGpu.list?.results?.filter(
        (c) =>
          c.service_type === "model-training" && c.type === "own_not_leasing"
      ) ?? []
    );
  }, [rentedGpu.list?.results]);

  const autoProvisionNode = React.useMemo(
    () => <AutoProvision key="auto-provision" />,
    []
  );

  React.useEffect(() => {
    const installedGpus =
      [...marketGpu, ...selfHostGpu].filter(
        (c) => c.compute_install === "completed"
      ) ?? [];
    const installingGpus =
      [...marketGpu, ...selfHostGpu].filter(
        (c) => c.compute_install === "installing"
      ) ?? [];

    if (installedGpus.length === 0 || installingGpus.length > 0) {
      return;
    }

    const returnInfo = localStorage.getItem("computes-return");

    if (!returnInfo) {
      if (callbackUrl) {
        navigateToCallback();
      }
      return;
    }

    try {
      const data = JSON.parse(returnInfo);

      if (typeof data === "object" && "name" in data && "url" in data) {
        confirmDialog({
          title: data["name"],
          message:
            "It seems you have compute now. Do you want to continue with the project?",
          submitText: "Yes, continue with the project",
          onSubmit: () => navigate(data["url"]),
        });
      } else if (callbackUrl) {
        navigateToCallback();
      }
    } catch {
    } finally {
      localStorage.removeItem("computes-return");
    }
  }, [marketGpu, selfHostGpu, navigate, callbackUrl, navigateToCallback]);

  React.useEffect(() => {
    const unsubscribes =
      rentedGpu.list?.results?.map((c) => {
        if (
          c.compute_install !== "installing" &&
          c.compute_install !== "wait_verify" &&
          c.compute_install !== "wait_crypto"
        ) {
          return () => void 0;
        }

        return onMessage(c.compute_marketplace.infrastructure_id, (msg) => {
          if ("refresh" in msg) {
            rentedGpu.refresh();
            playSound();
          }
        });
      }) ?? [];

    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [onMessage, rentedGpu, rentedGpu.list?.results, playSound]);

  return (
    <InfrastructureContext.Provider
      value={{
        rentedGpu,
        globalStorages,
        selfHostedPlatform,
        selfHostStorage,
        marketGpu,
        selfHostGpu,
        autoProvisionNode,
      }}
    >
      {children}
    </InfrastructureContext.Provider>
  );
}

export const useInfrastructureProvider = () =>
  React.useContext(InfrastructureContext);
