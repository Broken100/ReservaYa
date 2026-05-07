import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/database';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, profile, loading } = useAuth();
  const location = useLocation();

  // Wait for both auth state AND profile/role to be available if user exists
  if (loading || (user && !role)) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentPath = location.pathname.replace(/\/$/, '');
  const isAtPaymentPage = currentPath === '/dashboard/pago';

  // Role based access control
  if (requiredRole && role && role !== requiredRole) {
    const fallback = role === 'admin' ? '/dashboard' : '/cliente/reservas';
    console.log(`[ProtectedRoute] Role mismatch: has '${role}', needs '${requiredRole}'. Redirecting to ${fallback}`);
    return <Navigate to={fallback} replace />;
  }

  // Payment check for admins without active subscription: redirect to payment page
  if (role === 'admin' && profile?.payment_status !== 'active') {
    if (!isAtPaymentPage) {
      console.log('[ProtectedRoute] Admin has not paid, redirecting to payment');
      return <Navigate to="/dashboard/pago" replace />;
    }
  }

  return <>{children}</>;
}
