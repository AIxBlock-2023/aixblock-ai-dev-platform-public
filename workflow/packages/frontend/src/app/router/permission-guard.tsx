import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission } from 'workflow-shared';

export const RoutePermissionGuard = ({
  permission,
  children,
}: {
  children: ReactNode;
  permission: Permission;
}) => {
  const { embedState } = useEmbedding();
  const { checkAccess } = useAuthorization();
  if (!checkAccess(permission) || !embedState.isEmbedded) {
    return <Navigate replace={true} to="/404"></Navigate>;
  }
  return children;
};
