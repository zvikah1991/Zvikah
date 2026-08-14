import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FullScreenSpinner } from '../components/ui/Spinner';
import type { UserRole } from '../types/database';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <FullScreenSpinner />;
  if (!profile.active) return <Navigate to="/login?inactive=1" replace />;
  if (profile.must_change_password) return <Navigate to="/change-password" replace />;

  return <>{children}</>;
}

export function RequireSessionOnly({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <FullScreenSpinner />;

  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!profile) return <FullScreenSpinner />;
  if (profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
}
