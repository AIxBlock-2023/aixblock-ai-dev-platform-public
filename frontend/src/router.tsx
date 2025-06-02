import React from "react";
import {createBrowserRouter, createRoutesFromElements, Outlet, Route, useMatches} from "react-router-dom";
import GuestLayout from "./layouts/GuestLayout";
import UserLayout from "./layouts/UserLayout";
import PageLogin from "./pages/Login";
import NotFound from "./pages/NotFound";
import ApiProvider from "./providers/ApiProvider";
import { AuthProvider } from "./providers/AuthProvider";
import composeProviders from "./utils/composeProviders";
import { default as ProjectsList } from "./pages/Project/List";
import { default as ProjectDetail } from "./pages/Project/Detail";
import { default as LLMEditor } from "./pages/Project/LLMEditor";
import { default as Document } from "./pages/Document/Index";
import { default as Organizations } from "./pages/Organizations/Index";
import { default as Computes } from "./pages/Computes/Index";
import { default as AccountSetting } from "./pages/AccountSetting/AccountInfo/AccountInfo";
import { default as Organization } from "./pages/Admin/Organization/Organization";
import { default as User } from "./pages/Admin/User/User";
import { default as Activity } from "./pages/Admin/Activity/Activity";
import { default as CryptoPayment } from "./pages/Admin/CryptoPayment/CryptoPayment";
import {default as ProjectSettings, GotoGeneralSettings} from "./pages/Project/Settings/Index";
import {UsersProvider} from "./providers/UsersProvider";
import {default as ComputeOptions} from "./pages/Computes/ComputeOptions/Index";
import {default as ProjectFallback} from "./pages/Project/Fallback";
import ComputesMarketplaceV2 from "./pages/ComputesMarketplaceV2/Index";
import {default as ModelsSellerPage} from "./pages/ModelsSeller/Index";
import {default as ProjectDemo} from "./pages/Project/Demo/Index";
import UseOur from "./pages/Computes/UseOur/Index";
import LoaderProvider from "./providers/LoaderProvider";
import { default as CatalogCompute } from "./pages/Admin/Compute/Catalog/Catalog";
import { default as ComputesCompute } from "./pages/Admin/Compute/Computes/Computes";
import { default as CatalogModel } from "./pages/Admin/Model/Catalog/Catalog";
import { default as ModelsModel } from "./pages/Admin/Model/Models/Models";
import { default as Plan } from "./pages/Admin/Subscription/Plan/Plan";
import { default as Subscription } from "./pages/Admin/Subscription/Subscription/Subscription";
import { default as WalletPage } from "./pages/Wallet";
import Template from "./pages/Admin/Template/Template";
import AddHost from "./pages/Computes/AddHost/Index";
import { default as Tutorial } from "./pages/Admin/Tutorial/Index";
import Signup from "./pages/Signup";
import TutorialArticle from "./pages/Admin/Tutorial/Article/Index";
import SetPrice from "./pages/Computes/AddHost/SetPrice/Index";
import ComputeAvailability from "./pages/Computes/AddHost/Availability/Index";
import RewardsPage from "./pages/Rewards/Index";
import RewardsHistory from "./pages/Admin/Rewards/History/History";
import RewardActions from "./pages/Admin/Rewards/Action/Action";
import ResetPassword from "./pages/ResetPassword/Index";
import { CachedProvider } from "./providers/CachedProvider";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import EditorDesigner from "./pages/Project/EditorDesigner/EditorDesigner";
import CentrifugeProvider from "./providers/CentrifugoProvider";
import DashboardPage from "./pages/Dashboard/Index";
import trainAndDeployRoutes from "./routes/trainAndDeploy";
import fineTuneAndDeployRoutes from "./routes/fineTuneAndDeploy";
import deployRoutes from "./routes/deploy";
import labelAndValidateDataRoutes from "./routes/labelAndValidateData";
import RentedModels from "./pages/RentedModels/RentedModels";
import SelfHost from "./pages/LandingPage/SelfHost";
import LeaseOutCompute from "./pages/LandingPage/LeaseOutCompute";
import CommercializeMyModels from "./pages/LandingPage/CommercializeMyModels";
import infrastructureRoutes from "./routes/infrastructure";
import pricingRoutes from "./routes/pricing";
import {StripeProvider} from "./providers/StripeProvider";
import stripeRoutes from "./routes/stripe";
import DataV2, {GotoLegacyDataUpload} from "./pages/Project/DataV2";
import FirstTime from "./pages/FirstTime";
import ModelsMarketplaceV2 from "./pages/ModelsMarketplaceV2/ModelsMarketplaceV2";
import NotificationProvider from "./providers/NotificationProvider";
import ModelsMarketplaceV2Detail from "./pages/ModelsMarketplaceV2/ModelsMarketplaceV2Detail";
import OAuthApplications from "./pages/Admin/OAuthApplications/OAuthApplications";
import ModelSellerForm from "@/pages/ModelsSellerV2/ModelSellerForm";
import ModelTasks from "@/pages/Admin/Model/Tasks/Tasks";
import AdminOrders from "@/pages/Admin/Orders/AdminOrders";
import WorkflowsProvider from "./providers/WorkflowsProvider";
import Workflows from "./pages/Workflows/Workflows";
import marketplaceRoutes from "./routes/marketplace";

const Providers = composeProviders([
  { provider: PayPalScriptProvider, props: { options: { clientId: window.APP_SETTINGS.paypalClientId } } },
  { provider: LoaderProvider },
  { provider: ApiProvider },
  { provider: AuthProvider },
  { provider: NotificationProvider },
  { provider: UsersProvider },
  { provider: CentrifugeProvider },
  { provider: CachedProvider },
  { provider: StripeProvider },
  { provider: WorkflowsProvider },
]).provider;

function TitleChanger() {
  const matches = useMatches();

  React.useLayoutEffect(() => {
    const list = matches.filter(r => r.handle);
    let title = "";

    if (list.length > 0) {
      const item = list.pop();

      // @ts-ignore
      if (item && item.handle?.title) {
        // @ts-ignore
        title = item.handle.title;
      }
    }

    if (title.length > 0) {
      document.title = title + " - " + window.APP_SETTINGS.title;
    } else {
      document.title = window.APP_SETTINGS.title ?? "";
    }
  }, [matches]);

  return null;
}

function RootElement() {
  return (
    <>
      <Providers>
        <Outlet />
      </Providers>
      <TitleChanger />
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootElement />}>
      <Route element={<GuestLayout />}>
        <Route path="/user/login" element={<PageLogin />} handle={{ title: "Login" }} />
        <Route path="/user/signup" element={<Signup />} handle={{ title: "Sign Up" }} />
      </Route>
      <Route element={<UserLayout/>}>
        <Route path="/projects" element={<ProjectsList/>} handle={{title: "Projects"}}/>
        <Route path="/projects/:projectID" element={<ProjectDetail/>}>
          <Route path="/projects/:projectID" element={<ProjectFallback />} />
          <Route path="/projects/:projectID/data" element={<DataV2/>}/>
          <Route path="/projects/:projectID/settings" element={<GotoGeneralSettings/>}/>
          <Route path="/projects/:projectID/settings/:page" element={<ProjectSettings/>}/>
          <Route path="/projects/:projectID/import/:page" element={<ProjectSettings/>}/>
          <Route path="/projects/:projectID/demo" element={<ProjectDemo/>}/>
				<Route path="/projects/:projectID/mce" element={<LLMEditor />} />
				<Route path="/projects/:projectID/editor-designer" element={<EditorDesigner />} />
				<Route path="/projects/:projectID/data-preparation/local-upload" element={<GotoLegacyDataUpload />} />
        </Route>
        <Route path="/document" element={<Document />} handle={{ title: 'Document' }} />
        <Route path="/self-host" element={<SelfHost />} handle={{ title: 'Self-host' }} />
        <Route path="/computes" handle={{ title: 'Computes' }} >
          <Route path="default" element={<UseOur />} />
          <Route path="add-host" element={<AddHost />} />
          <Route path="set-price/:infrastructureId" element={<SetPrice />} />
          <Route path=":computeId/availability" element={<ComputeAvailability />} /> 
          <Route path="add" element={<ComputeOptions />} />
          <Route path="" element={<Computes />} />
          <Route path="computes-marketplace" handle={{ title: 'Computes Marketplace' }} >
            <Route path="" element={<ComputesMarketplaceV2 />} />
          </Route>
        </Route>
        {/* <Route path="/computes-marketplace" element={<ComputesMarketplace />} /> */}
        <Route path="/lease-out-compute" element={<LeaseOutCompute />} handle={{ title: 'Lease out compute' }} />
        {/*<Route path="/computes-supplier" handle={{ title: 'Computes Supplier' }}>
          <Route path="add" element={<AddCompute />} />
          <Route path=":computeId" element={<AddCompute />} />
          <Route path="" element={<ComputesSupplierPage />} />
        </Route>*/}
        <Route path="/commercialize-my-models" element={<CommercializeMyModels />} handle={{ title: 'Commercialize My Models' }} />
        <Route path="/models-seller" handle={{ title: 'Models Seller' }}>
          <Route path=":id" element={<ModelSellerForm />} />
          <Route path="" element={<ModelsSellerPage />} />
        </Route>
        <Route path="/models-marketplace" handle={{ title: 'Models Marketplace' }}>
          <Route path="" element={<ModelsMarketplaceV2 />} />
          <Route path=":modelId" element={<ModelsMarketplaceV2Detail />} />
          {/*<Route path=":projectID" element={<MLModelMarketplace />} />*/}
          {/*<Route path=":projectID/detail" element={<ModelDetail />} />*/}
        </Route>
        <Route path="/rented-models" element={<RentedModels />} handle={{ title: 'Rented Models' }} />
        <Route path="/admin" handle={{ title: 'Admin' }}>
          <Route path="template" element={<Template />} />
          <Route path="organization" element={<Organization />} />
          <Route path="user" element={<User />} />
          <Route path="activity" element={<Activity />} />
          <Route path="crypto-payment" element={<CryptoPayment />} />
          <Route path="compute/catalog" element={<CatalogCompute />} />
          <Route path="compute/computes" element={<ComputesCompute />} />
          <Route path="model/catalog" element={<CatalogModel />} />
          <Route path="model/models" element={<ModelsModel />} />
          <Route path="model/tasks" element={<ModelTasks />} />
          <Route path="subscription/plan" element={<Plan />} />
          <Route path="subscription/subscription" element={<Subscription />} />
          <Route path="tutorial" element={<Tutorial />} handle={{ title: 'Tutorials' }}/>
          <Route path="tutorial/article/:id" element={<TutorialArticle />} handle={{ title: 'Article' }} />
          <Route path="rewards/history" element={<RewardsHistory />} handle={{ title: 'Rewards history' }}/>
          <Route path="rewards/actions" element={<RewardActions />} handle={{ title: 'Reward actions' }}/>
          <Route path="oauth" element={<OAuthApplications />} handle={{ title: 'OAuth Application' }}/>
          <Route path="orders" element={<AdminOrders />} handle={{ title: 'Orders' }}/>
        </Route>
				{/*<Route path="/create-project" element={<CreateProject />} handle={{ title: 'Create Project' }} />*/}
				
        <Route path="/user" handle={{ title: 'Account Setting' }}>
          <Route path="account" element={<AccountSetting />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="organization" element={<Organizations />} handle={{ title: 'Organizations' }} />
        </Route>
        <Route path="wallet" element={<WalletPage />} />

        <Route path="/dashboard" element={<DashboardPage/>} handle={{ title: "Dashboard" }}/>

        {infrastructureRoutes}
        {marketplaceRoutes}
        {trainAndDeployRoutes}
        {fineTuneAndDeployRoutes}
        {deployRoutes}
        {labelAndValidateDataRoutes}
        {pricingRoutes}
        {stripeRoutes}

        <Route path="/first-time" element={<FirstTime/>} handle={{ title: "Welcome" }}/>
        <Route path="/workflows/*" element={<Workflows/>} handle={{ title: "Workflow" }}/>

			</Route>
			<Route path="/user/reset-password" element={<ResetPassword />} handle={{ title: "Reset Password" }} />
      <Route path="*" element={<NotFound />} handle={{ title: "Page not found" }} />
    </Route>
  )
);

export default router;
