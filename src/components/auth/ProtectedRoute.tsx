'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles } from '@/hooks/useRoles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ComponentType<Record<string, never>>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback: Fallback = UnauthorizedPage,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { hasAnyRole, hasAllRoles } = useRoles();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  // Check role requirements
  if (roles.length > 0) {
    const hasRequiredRole = requireAll 
      ? hasAllRoles(roles)
      : hasAnyRole(roles);
    
    if (!hasRequiredRole) {
      return <Fallback />;
    }
  }

  // Check permission requirements
  if (permissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermission) {
      return <Fallback />;
    }
  }

  return <>{children}</>;
};

const UnauthorizedPage: React.FC = () => {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page or perform this action.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

export default ProtectedRoute;