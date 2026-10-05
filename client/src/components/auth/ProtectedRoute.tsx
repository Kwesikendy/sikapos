import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  fallbackPath?: string;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallbackPath = '/cashier-login',
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        id="protected-route-loading"
        className="min-h-screen flex flex-col items-center justify-center bg-[#FAFCFB] text-slate-800"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs">
            <div className="w-6 h-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-800">Verifying Terminal Session</p>
            <p className="text-xs text-slate-500">Checking credentials with SikaPOS Cloud...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${fallbackPath}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/merchant-signup" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
