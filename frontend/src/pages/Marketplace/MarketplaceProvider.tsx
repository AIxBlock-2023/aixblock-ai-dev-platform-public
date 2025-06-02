import React from "react";

type TPreviewTemplateModal = {
  datasource?: string | null,
  open: boolean,
}

export type TMarketplaceProvider = {
  previewTemplateModal: TPreviewTemplateModal,
  setPreviewTemplateModal: (previewTemplateModal: TPreviewTemplateModal) => void;
}

export const MarketplaceContext = React.createContext<TMarketplaceProvider>({
  previewTemplateModal: {
    open: false,
    datasource: null
  },
  setPreviewTemplateModal: () => void 0,
});

export default function MarketplaceProvider({ children }: React.PropsWithChildren) {
  const [previewTemplateModal, setPreviewTemplateModal] = React.useState<TPreviewTemplateModal>({
    open: false,
    datasource: null
  });

  return (
    <MarketplaceContext.Provider value={{
      previewTemplateModal: previewTemplateModal,
      setPreviewTemplateModal: setPreviewTemplateModal
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export const useMarketplaceProvider = () => React.useContext(MarketplaceContext);
