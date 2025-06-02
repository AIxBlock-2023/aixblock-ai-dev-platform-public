import { t } from 'i18next';
import { Brain, Flag, ListTodo, Network, Server, Table2, Workflow } from 'lucide-react';
import { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { isNil, Permission } from 'workflow-shared';

import { authenticationSession } from '../../lib/authentication-session';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import {
    SidebarComponent,
    SidebarGroup,
    SidebarItem,
    SidebarLink,
} from './sidebar';

type DashboardContainerProps = {
  children: React.ReactNode;
  hideHeader?: boolean;
  removeGutters?: boolean;
  removeBottomPadding?: boolean;
};

const ProjectChangedRedirector = ({
  currentProjectId,
  children,
}: {
  currentProjectId: string;
  children: React.ReactNode;
}) => {
  projectHooks.useReloadPageIfProjectIdChanged(currentProjectId);
  return children;
};
export const CloseTaskLimitAlertContext = createContext({
  isAlertClosed: false,
  setIsAlertClosed: (isAlertClosed: boolean) => {},
});

export function DashboardContainer({
  children,
  removeGutters,
  hideHeader,
  removeBottomPadding,
}: DashboardContainerProps) {
  const [automationOpen, setAutomationOpen] = useState(true);
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();
  const { project } = projectHooks.useCurrentProject();
  const { embedState } = useEmbedding();
  const currentProjectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const [isAlertClosed, setIsAlertClosed] = useState(false);
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }
  const embedFilter = (link: SidebarItem) => {
    if (link.type === 'link') {
      return !embedState.isEmbedded || !!link.showInEmbed;
    }
    return true;
  };
  const permissionFilter = (link: SidebarItem) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };

  const filterAlerts = (item: SidebarItem) =>
    platform.alertsEnabled || item.label !== t('Alerts');

  const flowsLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/flows'),
    label: t('Flows'),
    icon: Workflow,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_FLOW),
    isSubItem: false,
  };

  const runsLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/runs'),
    label: t('Runs'),
    icon: Flag,
    showInEmbed: true,
    notification: showIssuesNotification,
    hasPermission: checkAccess(Permission.READ_RUN),
    isSubItem: false,
  };

  const connectionsLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/connections'),
    label: t('Connections'),
    icon: Network,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
    isSubItem: false,
  };

  const mcpLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/mcp'),
    label: t('MCP'),
    icon: Server,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_MCP),
    isSubItem: false,
  };

  const tablesLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/tables'),
    label: t('Tables'),
    icon: Table2,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_TABLE),
    isSubItem: false,
  };

  const todosLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/todos'),
    label: t('Todos'),
    icon: ListTodo,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_TODOS),
    isSubItem: false,
  };

  const aiProvidersLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/ai-providers'),
    label: t('AI Providers'),
    icon: Brain,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_PROJECT),
    isSubItem: false,
  };

  const items: SidebarItem[] = [flowsLink, runsLink, connectionsLink, mcpLink, tablesLink, todosLink, aiProvidersLink]
    .filter(embedFilter)
    .filter(permissionFilter)
    .filter(filterAlerts);

  for (const item of items) {
    if (item.type === 'group') {
      const newItems = item.items
        .filter(embedFilter)
        .filter(permissionFilter)
        .filter(filterAlerts);
      item.items = newItems;
    }
  }

  const filteredItems = items.filter((item) => {
    if (item.type === 'group') {
      return item.items.length > 0;
    }
    return true;
  });

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <ProjectChangedRedirector currentProjectId={currentProjectId}>
        <CloseTaskLimitAlertContext.Provider
          value={{
            isAlertClosed,
            setIsAlertClosed,
          }}
        >
          <SidebarComponent
            removeGutters={removeGutters}
            isHomeDashboard={true}
            hideHeader={hideHeader}
            items={filteredItems}
            hideSideNav={embedState.hideSideNav}
            removeBottomPadding={removeBottomPadding}
          >
            {children}
          </SidebarComponent>
        </CloseTaskLimitAlertContext.Provider>
      </ProjectChangedRedirector>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
