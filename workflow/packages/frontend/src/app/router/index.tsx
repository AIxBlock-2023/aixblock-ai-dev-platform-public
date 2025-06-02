import { useEffect, useMemo } from 'react';
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
  useLocation,
} from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { ChatPage } from '@/app/routes/chat';
import { EmbedPage } from '@/app/routes/embed';
import { RedirectPage } from '@/app/routes/redirect';
import { FlowRunsPage } from '@/app/routes/runs';
import { ProjectPiecesPage } from '@/app/routes/settings/blocks';
import { useEmbedding } from '@/components/embed-provider';
import { VerifyEmail } from '@/features/authentication/components/verify-email';
import { AcceptInvitation } from '@/features/team/component/accept-invitation';
import { authenticationSession } from '@/lib/authentication-session';
import { combinePaths, parentWindow } from '@/lib/utils';
import {
  WorkflowClientEventName,
  WorkflowVendorEventName,
  WorkflowVendorRouteChanged,
} from 'axb-embed-sdk';
import { Permission } from 'workflow-shared';

import { ApTableStateProvider } from '../../features/tables/components/ap-table-state-provider';
import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';
import { DashboardContainer } from '../components/dashboard-container';
import ProjectSettingsLayout from '../components/project-settings-layout';
import NotFoundPage from '../routes/404-page';
import { ApTablesPage } from '../routes/ap-tables';
import { ApTableEditorPage } from '../routes/ap-tables/id';
import AuthenticatePage from '../routes/authenticate';
import { ChangePasswordPage } from '../routes/change-password';
import { AppConnectionsPage } from '../routes/connections';
import { EmbeddedConnectionDialog } from '../routes/embed/embedded-connection-dialog';
import { FlowsPage } from '../routes/flows';
import { FlowBuilderPage } from '../routes/flows/id';
import { ResetPasswordPage } from '../routes/forget-password';
import { FormPage } from '../routes/forms';
import MCPPage from '../routes/mcp';
import { ProjectReleasesPage } from '../routes/project-release';
import ViewRelease from '../routes/project-release/view-release';
import { FlowRunPage } from '../routes/runs/id';
import AlertsPage from '../routes/settings/alerts';
import AppearancePage from '../routes/settings/appearance';
import { EnvironmentPage } from '../routes/settings/environment';
import GeneralPage from '../routes/settings/general';
import TeamPage from '../routes/settings/team';
import { SignInPage } from '../routes/sign-in';
import { SignUpPage } from '../routes/sign-up';
import { ShareTemplatePage } from '../routes/templates/share-template';
import { TodosPage } from '../routes/todos';
import { TodoTestingPage } from '../routes/todos/id';

import AIProvidersProjectPage from '@/app/routes/ai-providers';
import { AIxBlockAssignTasks } from '../routes/aixblock-assign-tasks';
import { AIxBlockCustomMultimodal } from '../routes/aixblock-custom-multimodal';
import { AIxBlockTasks } from '../routes/aixblock-tasks';
import { AIxBlockWebFormPage } from '../routes/aixblock-web-forms';
import { FlowPreviewPage } from '../routes/flows/id/Preview';
import UserGpuPage from '../routes/user-gpu';
import { AfterImportFlowRedirect } from './after-import-flow-redirect';
import { DefaultRoute } from './default-route';
import { RoutePermissionGuard } from './permission-guard';
import {
  ProjectRouterWrapper,
  TokenCheckerWrapper,
} from './project-route-wrapper';
const SettingsRerouter = () => {
  const { hash } = useLocation();
  const fragmentWithoutHash = hash.slice(1).toLowerCase();
  return fragmentWithoutHash ? (
    <Navigate to={`/settings/${fragmentWithoutHash}`} replace />
  ) : (
    <Navigate to="/settings/general" replace />
  );
};

const routes = [
  {
    path: '/embed',
    element: <EmbedPage></EmbedPage>,
  },
  {
    path: '/embed/connections',
    element: <EmbeddedConnectionDialog></EmbeddedConnectionDialog>,
  },
  ...ProjectRouterWrapper({
    path: '/flows',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_FLOW}>
          <PageTitle title="Flows">
            <FlowsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flows/:flowId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <RoutePermissionGuard permission={Permission.READ_FLOW}>
          <PageTitle title="Builder">
            <FlowBuilderPage />
          </PageTitle>
        </RoutePermissionGuard>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flows/:flowId/preview',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <RoutePermissionGuard permission={Permission.READ_FLOW}>
          <PageTitle title="Preview Flow">
            <FlowPreviewPage />
          </PageTitle>
        </RoutePermissionGuard>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flows/:flowId/step/:stepId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <RoutePermissionGuard permission={Permission.READ_FLOW}>
          <PageTitle title="Action Gpu">
            <UserGpuPage />
          </PageTitle>
        </RoutePermissionGuard>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/flow-import-redirect/:flowId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <AfterImportFlowRedirect></AfterImportFlowRedirect>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  }),
  {
    path: '/forms/:flowId',
    element: (
      <PageTitle title="Forms">
        <FormPage />
      </PageTitle>
    ),
  },
  {
    path: '/aixblock-web-forms/:flowId',
    element: (
      <PageTitle title="AIxBlock web forms">
        <AIxBlockWebFormPage />
      </PageTitle>
    ),
  },
  {
    path: '/aixblock-tasks/:flowId',
    element: (
      <PageTitle title="AIxBlock tasks">
        <AIxBlockTasks />
      </PageTitle>
    ),
  },
  {
    path: '/aixblock-assign-tasks/:taskEncodedKey',
    element: (
      <PageTitle title="AIxBlock assign tasks">
        <AIxBlockAssignTasks />
      </PageTitle>
    ),
  },
  {
    path: '/aixblock-tasks/custom-multimodal/:flowId',
    element: (
      <PageTitle title="AIxBlock custom multimodal">
        <AIxBlockCustomMultimodal />
      </PageTitle>
    ),
  },
  {
    path: '/chats/:flowId',
    element: (
      <PageTitle title="Chats">
        <ChatPage />
      </PageTitle>
    ),
  },
  ...ProjectRouterWrapper({
    path: '/runs/:runId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <RoutePermissionGuard permission={Permission.READ_RUN}>
          <PageTitle title="Flow Run">
            <FlowRunPage />
          </PageTitle>
        </RoutePermissionGuard>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  }),
  {
    path: '/templates/:templateId',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <PageTitle title="Share Template">
          <ShareTemplatePage />
        </PageTitle>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  ...ProjectRouterWrapper({
    path: '/releases/:releaseId',
    element: (
      <DashboardContainer>
        <PageTitle title="Releases">
          <ViewRelease />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/runs',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_RUN}>
          <PageTitle title="Runs">
            <FlowRunsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/tables',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_TABLE}>
          <PageTitle title="Tables">
            <ApTablesPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/tables/:tableId',
    element: (
      <RoutePermissionGuard permission={Permission.READ_TABLE}>
        <DashboardContainer removeGutters removeBottomPadding>
          <PageTitle title="Table">
            <ApTableStateProvider>
              <ApTableEditorPage />
            </ApTableStateProvider>
          </PageTitle>
        </DashboardContainer>
      </RoutePermissionGuard>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/connections',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_APP_CONNECTION}>
          <PageTitle title="Connections">
            <AppConnectionsPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/releases',
    element: (
      <DashboardContainer>
        <PageTitle title="Releases">
          <ProjectReleasesPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/todos',
    element: (
      <DashboardContainer>
        <PageTitle title="Todos">
          <TodosPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/todos/:todoId',
    element: (
      <PageTitle title="Todo Testing">
        <TodoTestingPage />
      </PageTitle>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings',
    element: (
      <DashboardContainer>
        <SettingsRerouter></SettingsRerouter>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/ai-providers',
    element: (
      <DashboardContainer>
        <PageTitle title="AI Providers">
          <AIProvidersProjectPage />
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/alerts',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_ALERT}>
          <PageTitle title="Alerts">
            <ProjectSettingsLayout>
              <AlertsPage />
            </ProjectSettingsLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/appearance',
    element: (
      <DashboardContainer>
        <PageTitle title="Appearance">
          <ProjectSettingsLayout>
            <AppearancePage />
          </ProjectSettingsLayout>
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/general',
    element: (
      <DashboardContainer>
        <PageTitle title="General">
          <ProjectSettingsLayout>
            <GeneralPage />
          </ProjectSettingsLayout>
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/blocks',
    element: (
      <DashboardContainer>
        <PageTitle title="Blocks">
          <ProjectSettingsLayout>
            <ProjectPiecesPage />
          </ProjectSettingsLayout>
        </PageTitle>
      </DashboardContainer>
    ),
  }),
  ...ProjectRouterWrapper({
    path: '/settings/team',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_PROJECT_MEMBER}>
          <PageTitle title="Team">
            <ProjectSettingsLayout>
              <TeamPage />
            </ProjectSettingsLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),
  {
    path: '/team',
    element: <Navigate to="/settings/team" replace></Navigate>,
  },

  ...ProjectRouterWrapper({
    path: '/settings/environments',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_PROJECT_RELEASE}>
          <PageTitle title="Environments">
            <ProjectSettingsLayout>
              <EnvironmentPage />
            </ProjectSettingsLayout>
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),

  ...ProjectRouterWrapper({
    path: '/mcp',
    element: (
      <DashboardContainer>
        <RoutePermissionGuard permission={Permission.READ_MCP}>
          <PageTitle title="MCP">
            <MCPPage />
          </PageTitle>
        </RoutePermissionGuard>
      </DashboardContainer>
    ),
  }),

  {
    path: '/404',
    element: (
      <PageTitle title="Not Found">
        <NotFoundPage showHomeButton={false} />
      </PageTitle>
    ),
  },
  {
    path: '/redirect',
    element: <RedirectPage></RedirectPage>,
  },
  {
    path: '/projects/:projectId',
    element: (
      <TokenCheckerWrapper>
        <DefaultRoute></DefaultRoute>
      </TokenCheckerWrapper>
    ),
  },
  {
    path: '/*',
    element: (
      <PageTitle title="Redirect">
        <DefaultRoute></DefaultRoute>
      </PageTitle>
    ),
  },
];

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const projectId = authenticationSession.getProjectId();
  const router = useMemo(() => {
    return embedState.isEmbedded
      ? createMemoryRouter(routes, {
          initialEntries: [window.location.pathname],
        })
      : createBrowserRouter(routes);
  }, [embedState.isEmbedded]);

  useEffect(() => {
    if (!embedState.isEmbedded) {
      return;
    }

    const handleVendorRouteChange = (
      event: MessageEvent<WorkflowVendorRouteChanged>,
    ) => {
      if (
        event.source === parentWindow &&
        event.data.type === WorkflowVendorEventName.VENDOR_ROUTE_CHANGED
      ) {
        const targetRoute = event.data.data.vendorRoute;
        const targetRouteRequiresProjectId =
          targetRoute.includes('/runs') ||
          targetRoute.includes('/flows') ||
          targetRoute.includes('/connections');
        if (!targetRouteRequiresProjectId) {
          router.navigate(targetRoute);
        } else {
          router.navigate(
            combinePaths({
              secondPath: targetRoute,
              firstPath: `/projects/${projectId}`,
            }),
          );
        }
      }
    };

    window.addEventListener('message', handleVendorRouteChange);

    return () => {
      window.removeEventListener('message', handleVendorRouteChange);
    };
  }, [embedState.isEmbedded, router.navigate]);

  useEffect(() => {
    if (!embedState.isEmbedded) {
      return;
    }
    router.subscribe((state) => {
      const pathNameWithoutProjectOrProjectId = state.location.pathname.replace(
        /\/projects\/[^/]+/,
        '',
      );
      parentWindow.postMessage(
        {
          type: WorkflowClientEventName.CLIENT_ROUTE_CHANGED,
          data: {
            route: pathNameWithoutProjectOrProjectId + state.location.search,
          },
        },
        '*',
      );
    });
  }, [router, embedState.isEmbedded]);

  return <RouterProvider router={router}></RouterProvider>;
};

export { ApRouter };

