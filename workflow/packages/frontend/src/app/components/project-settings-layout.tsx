import { t } from 'i18next';
import {
  Bell,
  GitBranch,
  Puzzle,
  Settings,
  SunMoon,
  Users,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

import SidebarLayout, { SidebarItem } from '@/app/components/sidebar-layout';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { isNil, Permission } from 'workflow-shared';

import { useEmbedding } from '@/components/embed-provider';
import { authenticationSession } from '../../lib/authentication-session';

const iconSize = 20;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function ProjectSettingsLayout({
  children,
}: SettingsLayoutProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const currentProjectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();

  if (isNil(currentProjectId)) {
    return <Navigate to="/sign-in" replace />;
  }
  const sidebarNavItems: SidebarItem[] = [
    {
      title: t('General'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/general'),
      icon: <Settings size={iconSize} />,
    },
    {
      title: t('Appearance'),
      href: authenticationSession.appendProjectRoutePrefix(
        '/settings/appearance',
      ),
      icon: <SunMoon size={iconSize} />,
    },
    {
      title: t('Team'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/team'),
      icon: <Users size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_PROJECT_MEMBER),
    },
    {
      title: t('Blocks'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/blocks'),
      icon: <Puzzle size={iconSize} />,
    },
    {
      title: t('Alerts'),
      href: authenticationSession.appendProjectRoutePrefix('/settings/alerts'),
      icon: <Bell size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_ALERT),
    },
    {
      title: t('Environments'),
      href: authenticationSession.appendProjectRoutePrefix(
        '/settings/environments',
      ),
      icon: <GitBranch size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_PROJECT_RELEASE),
    },
  ];

  const filterAlerts = (item: SidebarItem) =>
    platform.alertsEnabled || item.title !== t('Alerts');
  const filterOnPermission = (item: SidebarItem) =>
    isNil(item.hasPermission) || item.hasPermission;

  const filteredNavItems = sidebarNavItems
    .filter(filterAlerts)
    .filter(filterOnPermission);

  if (embedState.isEmbedded) {
    return children;
  }

  return (
    <SidebarLayout title={t('Settings')} items={filteredNavItems}>
      {children}
    </SidebarLayout>
  );
}
