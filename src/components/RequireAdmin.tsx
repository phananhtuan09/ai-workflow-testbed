import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/orders" replace />;
  return <Outlet />;
}
