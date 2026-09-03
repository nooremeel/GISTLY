import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard — redirects unauthenticated users to `/login`.
 * Renders nothing while the auth check is in-flight to avoid a flash
 * of protected content (or a premature redirect for users who are
 * actually logged in but whose session hasn't resolved yet).
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Auth check still in-flight — render nothing to avoid a flash.
  if (loading) return null;

  // No session — send to login page, preserving the current URL for
  // post-login redirect (replace: true avoids a useless history entry).
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
