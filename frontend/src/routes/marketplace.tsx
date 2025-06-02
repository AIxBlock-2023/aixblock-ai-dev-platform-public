import { Route } from "react-router-dom";
import Marketplace from "../pages/Marketplace/Marketplace";
import ComputesMarketplaceV2 from "@/pages/Marketplace/Compute/Index";
import TemplateMarketplace from "@/pages/Marketplace/Workflow/TemplateMarketplace";
import ModelsMarketplaceV2 from "@/pages/Marketplace/Model/ModelsMarketplace";
import ModelsMarketplaceV2Detail from "@/pages/Marketplace/Model/ModelsMarketplaceDetail";
import TemplateDetail from "@/pages/Marketplace/Workflow/TemplateDetail";


const marketplaceRoutes = (
  <Route path="/marketplace" element={<Marketplace />}>
    <Route path="workflow">
      <Route path="" element={<TemplateMarketplace />} />
      <Route path=":id" element={<TemplateDetail />} handle={{ title: "Buy Workflow Template" }} />
    </Route>
    <Route path="computes" element={<ComputesMarketplaceV2 />} />
    <Route path="models" handle={{ title: 'Models Marketplace' }}>
      <Route path="" element={<ModelsMarketplaceV2 />} />
      <Route path=":modelId" element={<ModelsMarketplaceV2Detail />} />
    </Route>
  </Route>
)

export default marketplaceRoutes;
