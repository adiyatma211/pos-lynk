'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles } from '@/hooks/useRoles';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
  noAccessComponent?: React.ComponentType<Record<string, never>>;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  fallback = null,
  noAccessComponent: NoAccessComponent,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { hasRole, hasAnyRole, hasAllRoles } = useRoles();

  // Check role requirements
  if (role || roles.length > 0) {
    const hasRequiredRole = role 
      ? hasRole(role)
      : requireAll 
        ? hasAllRoles(roles)
        : hasAnyRole(roles);
    
    if (!hasRequiredRole) {
      return <>{NoAccessComponent ? <NoAccessComponent /> : fallback}</>;
    }
  }

  // Check permission requirements
  if (permission || permissions.length > 0) {
    const hasRequiredPermission = permission
      ? hasPermission(permission)
      : requireAll 
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    
    if (!hasRequiredPermission) {
      return <>{NoAccessComponent ? <NoAccessComponent /> : fallback}</>;
    }
  }

  return <>{children}</>;
};

// Convenience components for common use cases
export const CanViewDashboard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permission="dashboard.view" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageProducts: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permissions={['products.view', 'products.create', 'products.edit', 'products.delete']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanCreateProduct: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permission="products.create" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanEditProduct: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permission="products.edit" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanDeleteProduct: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permission="products.delete" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageCategories: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permissions={['categories.view', 'categories.create', 'categories.edit', 'categories.delete']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageTransactions: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permissions={['transactions.view', 'transactions.create', 'transactions.edit', 'transactions.delete']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanCreateTransaction: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permission="transactions.create" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageReceipts: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permissions={['receipts.view', 'receipts.generate', 'receipts.download', 'receipts.upload', 'receipts.delete']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanGenerateReceipt: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permission="receipts.generate" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageStock: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permissions={['stock.view', 'stock.adjust']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanAdjustStock: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permission="stock.adjust" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanViewReports: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permissions={['reports.sales', 'reports.inventory', 'reports.financial']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageUsers: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permissions={['users.view', 'users.create', 'users.edit', 'users.delete']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageSystem: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    permissions={['system.view', 'system.edit']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

// Role-based guards
export const IsSuperAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    role="super_admin" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const IsRegionalManager: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    role="regional_manager" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const IsStoreManager: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    role="store_manager" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const IsSupervisor: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    role="supervisor" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const IsCashier: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    role="cashier" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const IsStockKeeper: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    role="stock_keeper" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const IsViewer: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    role="viewer" 
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

// Minimum role level guards
export const IsAtLeastManager: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    roles={['store_manager', 'regional_manager', 'super_admin']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const IsAtLeastSupervisor: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    roles={['supervisor', 'store_manager', 'regional_manager', 'super_admin']} 
    requireAll={false}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export default PermissionGuard;