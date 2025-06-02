import { Navigate, useLocation } from 'react-router-dom';

import NotFoundPage from '@/app/routes/404-page';
import { useEmbedding } from '@/components/embed-provider';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute } from '@/lib/utils';

export const DefaultRoute = () => {
  const { embedState } = useEmbedding();
  const token = authenticationSession.getToken();
  const { checkAccess } = useAuthorization();
  const location = useLocation();

  if (!token || !embedState.isEmbedded) {
    const searchParams = new URLSearchParams();
    searchParams.set('from', location.pathname + location.search);
    return <NotFoundPage showHomeButton={false} />;
  }
  return <Navigate to={determineDefaultRoute(checkAccess)} replace></Navigate>;
};
