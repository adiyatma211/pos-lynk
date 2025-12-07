import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSION_GROUPS, PERMISSIONS } from '@/types/auth/roles';

export const usePermissions = () => {
  const { permissions, currentLocation } = useAuth();

  const hasPermission = useCallback((permission: string, locationId?: string): boolean => {
    if (!permissions.length) return false;
    
    // Check global permissions
    const hasGlobalPermission = permissions.includes(permission);
    if (hasGlobalPermission && !locationId) return true;
    
    // For location-specific permissions, we'd need backend support
    // For now, we'll use global permissions
    return hasGlobalPermission;
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: string[], locationId?: string): boolean => {
    return perms.some(perm => hasPermission(perm, locationId));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((perms: string[], locationId?: string): boolean => {
    return perms.every(perm => hasPermission(perm, locationId));
  }, [hasPermission]);

  const getPermissionsByModule = useCallback((module: string): string[] => {
    // Group permissions by module
    const modulePermissions = PERMISSION_GROUPS[module.toUpperCase() as keyof typeof PERMISSION_GROUPS];
    return [...(modulePermissions || [])];
  }, []);

  const canAccessModule = useCallback((module: string): boolean => {
    const modulePermissions = getPermissionsByModule(module);
    return hasAnyPermission(modulePermissions);
  }, [hasAnyPermission, getPermissionsByModule]);

  const canViewDashboard = useCallback(() => {
    return hasPermission(PERMISSIONS.DASHBOARD_VIEW);
  }, [hasPermission]);

  const canManageProducts = useCallback(() => {
    return hasAnyPermission([
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_EDIT,
      PERMISSIONS.PRODUCTS_DELETE,
    ]);
  }, [hasAnyPermission]);

  const canManageCategories = useCallback(() => {
    return hasAnyPermission([
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.CATEGORIES_CREATE,
      PERMISSIONS.CATEGORIES_EDIT,
      PERMISSIONS.CATEGORIES_DELETE,
    ]);
  }, [hasAnyPermission]);

  const canManageTransactions = useCallback(() => {
    return hasAnyPermission([
      PERMISSIONS.TRANSACTIONS_VIEW,
      PERMISSIONS.TRANSACTIONS_CREATE,
      PERMISSIONS.TRANSACTIONS_EDIT,
      PERMISSIONS.TRANSACTIONS_DELETE,
    ]);
  }, [hasAnyPermission]);

  const canManageReceipts = useCallback(() => {
    return hasAnyPermission([
      PERMISSIONS.RECEIPTS_VIEW,
      PERMISSIONS.RECEIPTS_GENERATE,
      PERMISSIONS.RECEIPTS_DOWNLOAD,
      PERMISSIONS.RECEIPTS_UPLOAD,
      PERMISSIONS.RECEIPTS_DELETE,
    ]);
  }, [hasAnyPermission]);

  const canManageStock = useCallback(() => {
    return hasAnyPermission([
      PERMISSIONS.STOCK_VIEW,
      PERMISSIONS.STOCK_ADJUST,
    ]);
  }, [hasAnyPermission]);

  const canViewReports = useCallback(() => {
    return hasAnyPermission([
      PERMISSIONS.REPORTS_SALES,
      PERMISSIONS.REPORTS_INVENTORY,
      PERMISSIONS.REPORTS_FINANCIAL,
    ]);
  }, [hasAnyPermission]);

  const canManageUsers = useCallback(() => {
    return hasAnyPermission([
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.USERS_DELETE,
    ]);
  }, [hasAnyPermission]);

  const canManageSystem = useCallback(() => {
    return hasAnyPermission([
      PERMISSIONS.SYSTEM_VIEW,
      PERMISSIONS.SYSTEM_EDIT,
    ]);
  }, [hasAnyPermission]);

  // Granular permission checks
  const canCreateProduct = useCallback(() => hasPermission(PERMISSIONS.PRODUCTS_CREATE), [hasPermission]);
  const canEditProduct = useCallback(() => hasPermission(PERMISSIONS.PRODUCTS_EDIT), [hasPermission]);
  const canDeleteProduct = useCallback(() => hasPermission(PERMISSIONS.PRODUCTS_DELETE), [hasPermission]);

  const canCreateCategory = useCallback(() => hasPermission(PERMISSIONS.CATEGORIES_CREATE), [hasPermission]);
  const canEditCategory = useCallback(() => hasPermission(PERMISSIONS.CATEGORIES_EDIT), [hasPermission]);
  const canDeleteCategory = useCallback(() => hasPermission(PERMISSIONS.CATEGORIES_DELETE), [hasPermission]);

  const canCreateTransaction = useCallback(() => hasPermission(PERMISSIONS.TRANSACTIONS_CREATE), [hasPermission]);
  const canEditTransaction = useCallback(() => hasPermission(PERMISSIONS.TRANSACTIONS_EDIT), [hasPermission]);
  const canDeleteTransaction = useCallback(() => hasPermission(PERMISSIONS.TRANSACTIONS_DELETE), [hasPermission]);

  const canGenerateReceipt = useCallback(() => hasPermission(PERMISSIONS.RECEIPTS_GENERATE), [hasPermission]);
  const canDownloadReceipt = useCallback(() => hasPermission(PERMISSIONS.RECEIPTS_DOWNLOAD), [hasPermission]);
  const canUploadReceipt = useCallback(() => hasPermission(PERMISSIONS.RECEIPTS_UPLOAD), [hasPermission]);
  const canDeleteReceipt = useCallback(() => hasPermission(PERMISSIONS.RECEIPTS_DELETE), [hasPermission]);

  const canAdjustStock = useCallback(() => hasPermission(PERMISSIONS.STOCK_ADJUST), [hasPermission]);

  const canCreateUser = useCallback(() => hasPermission(PERMISSIONS.USERS_CREATE), [hasPermission]);
  const canEditUser = useCallback(() => hasPermission(PERMISSIONS.USERS_EDIT), [hasPermission]);
  const canDeleteUser = useCallback(() => hasPermission(PERMISSIONS.USERS_DELETE), [hasPermission]);

  const canEditSystem = useCallback(() => hasPermission(PERMISSIONS.SYSTEM_EDIT), [hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByModule,
    canAccessModule,
    
    // Module-level permissions
    canViewDashboard,
    canManageProducts,
    canManageCategories,
    canManageTransactions,
    canManageReceipts,
    canManageStock,
    canViewReports,
    canManageUsers,
    canManageSystem,
    
    // Granular permissions
    canCreateProduct,
    canEditProduct,
    canDeleteProduct,
    canCreateCategory,
    canEditCategory,
    canDeleteCategory,
    canCreateTransaction,
    canEditTransaction,
    canDeleteTransaction,
    canGenerateReceipt,
    canDownloadReceipt,
    canUploadReceipt,
    canDeleteReceipt,
    canAdjustStock,
    canCreateUser,
    canEditUser,
    canDeleteUser,
    canEditSystem,
  };
};