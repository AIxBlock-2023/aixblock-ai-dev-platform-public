import React, { useEffect, useState } from "react";
import { TSidebar, useUserLayout } from "@/layouts/UserLayout";
import Tabs from "./Tabs";
import MarketplaceProvider, { useMarketplaceProvider } from "./MarketplaceProvider";
import "./Marketplace.scss";
import { Outlet, useLocation } from "react-router-dom";
import IconCloseColor from "@/assets/icons/IconCloseColor";
import EmptyContent from "@/components/EmptyContent/EmptyContent";

function Content() {
  const { previewTemplateModal, setPreviewTemplateModal } = useMarketplaceProvider();
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (previewTemplateModal.open && previewTemplateModal.datasource) {
      setLoading(true);   // Bắt đầu load
    }
  }, [previewTemplateModal.open, previewTemplateModal.datasource]);

  const handleIframeLoad = () => {
    setLoading(false);
  };


  useEffect(() => {
    setPreviewTemplateModal({ open: false })
  }, [location, setPreviewTemplateModal])

  return (
    <div className="marketplace__container">
      <Outlet />
      {previewTemplateModal.open && (
        <div id="PreviewContainer">
          {loading &&
            <div>
              <div className="mask" />
              <EmptyContent message="Loading image..." />
            </div>
          }

          {previewTemplateModal.datasource && (
            <iframe
              title="PreviewTemplate"
              src={previewTemplateModal.datasource}
              width="100%"
              height="100%"
              onLoad={handleIframeLoad}
            />
          )}

          {!loading && (
            <div className="closeButton" onClick={() => setPreviewTemplateModal({ open: false })}>
              <IconCloseColor />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Marketplace() {
  const { setBreadcrumbs, clearBreadcrumbs, setExpandSideBar } = useUserLayout();

  React.useEffect(() => {
    setBreadcrumbs([{ label: "Marketplace" }]);
    setExpandSideBar((prev: TSidebar) => {
      return { ...prev, isExpand: false };
    })
    return () => clearBreadcrumbs();
  }, [clearBreadcrumbs, setBreadcrumbs, setExpandSideBar]);
  return (
    <MarketplaceProvider>
      <Tabs />
      <Content />
    </MarketplaceProvider>
  );
}
