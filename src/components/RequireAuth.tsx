import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LoadingState } from './StateView';

export function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <LoadingState />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
