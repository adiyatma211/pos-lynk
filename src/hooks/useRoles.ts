import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_HIERARCHY, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '@/types/auth/roles';

export const useRoles = () => {
  const { user } = useAuth();

  const hasRole = useCallback((role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  }, [user?.roles]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  }, [hasRole]);

  const getHighestRoleLevel = useCallback((): number => {
    if (!user?.roles?.length) return 0;
    return Math.max(...user.roles.map(role => ROLE_HIERARCHY[role as UserRole] || 0));
  }, [user?.roles]);

  const isAtLeastRole = useCallback((minRole: UserRole): boolean => {
    const userLevel = getHighestRoleLevel();
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= requiredLevel;
  }, [getHighestRoleLevel]);

  const getHighestRole = useCallback((): string | null => {
    if (!user?.roles?.length) return null;
    
    let highestRole = '';
    let highestLevel = 0;
    
    user.roles.forEach(role => {
      const level = ROLE_HIERARCHY[role as UserRole] || 0;
      if (level > highestLevel) {
        highestLevel = level;
        highestRole = role;
      }
    });
    
    return highestRole;
  }, [user?.roles]);

  const getRoleDisplayName = useCallback((role: string): string => {
    return ROLE_DISPLAY_NAMES[role as UserRole] || role;
  }, []);

  const getRoleDescription = useCallback((role: string): string => {
    return ROLE_DESCRIPTIONS[role as UserRole] || '';
  }, []);

  const isSuperAdmin = useCallback(() => hasRole(UserRole.SUPER_ADMIN), [hasRole]);
  const isRegionalManager = useCallback(() => hasRole(UserRole.REGIONAL_MANAGER), [hasRole]);
  const isStoreManager = useCallback(() => hasRole(UserRole.STORE_MANAGER), [hasRole]);
  const isSupervisor = useCallback(() => hasRole(UserRole.SUPERVISOR), [hasRole]);
  const isCashier = useCallback(() => hasRole(UserRole.CASHIER), [hasRole]);
  const isStockKeeper = useCallback(() => hasRole(UserRole.STOCK_KEEPER), [hasRole]);
  const isViewer = useCallback(() => hasRole(UserRole.VIEWER), [hasRole]);

  const canManageUsers = useCallback(() => {
    return isAtLeastRole(UserRole.REGIONAL_MANAGER);
  }, [isAtLeastRole]);

  const canManageSystem = useCallback(() => {
    return isSuperAdmin();
  }, [isSuperAdmin]);

  const canManageMultipleLocations = useCallback(() => {
    return isAtLeastRole(UserRole.REGIONAL_MANAGER);
  }, [isAtLeastRole]);

  const canManageStore = useCallback(() => {
    return isAtLeastRole(UserRole.STORE_MANAGER);
  }, [isAtLeastRole]);

  const canSuperviseStaff = useCallback(() => {
    return isAtLeastRole(UserRole.SUPERVISOR);
  }, [isAtLeastRole]);

  const canProcessTransactions = useCallback(() => {
    return isAtLeastRole(UserRole.CASHIER);
  }, [isAtLeastRole]);

  const canManageInventory = useCallback(() => {
    return isAtLeastRole(UserRole.STOCK_KEEPER);
  }, [isAtLeastRole]);

  const canViewReports = useCallback(() => {
    return isAtLeastRole(UserRole.VIEWER);
  }, [isAtLeastRole]);

  const getAccessibleRoles = useCallback((): UserRole[] => {
    const userLevel = getHighestRoleLevel();
    
    // Users can only assign roles at or below their level
    return Object.values(UserRole).filter(role => {
      const roleLevel = ROLE_HIERARCHY[role];
      return roleLevel <= userLevel;
    });
  }, [getHighestRoleLevel]);

  const canAssignRole = useCallback((targetRole: UserRole): boolean => {
    const userLevel = getHighestRoleLevel();
    const targetLevel = ROLE_HIERARCHY[targetRole];
    
    // Can only assign roles at or below your level
    // Super admins can assign any role
    if (isSuperAdmin()) return true;
    
    return targetLevel < userLevel;
  }, [getHighestRoleLevel, isSuperAdmin]);

  const getRoleHierarchy = useCallback((): Array<{ role: UserRole; level: number; displayName: string; description: string }> => {
    return Object.values(UserRole)
      .map(role => ({
        role,
        level: ROLE_HIERARCHY[role],
        displayName: ROLE_DISPLAY_NAMES[role],
        description: ROLE_DESCRIPTIONS[role],
      }))
      .sort((a, b) => b.level - a.level); // Sort by level descending
  }, []);

  const getUserRolesWithInfo = useCallback((): Array<{ role: string; displayName: string; description: string; level: number }> => {
    if (!user?.roles?.length) return [];
    
    return user.roles.map(role => ({
      role,
      displayName: getRoleDisplayName(role),
      description: getRoleDescription(role),
      level: ROLE_HIERARCHY[role as UserRole] || 0,
    }));
  }, [user?.roles, getRoleDisplayName, getRoleDescription]);

  return {
    // Basic role checks
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Role hierarchy
    getHighestRoleLevel,
    isAtLeastRole,
    getHighestRole,
    
    // Role information
    getRoleDisplayName,
    getRoleDescription,
    
    // Specific role checks
    isSuperAdmin,
    isRegionalManager,
    isStoreManager,
    isSupervisor,
    isCashier,
    isStockKeeper,
    isViewer,
    
    // Permission-based role checks
    canManageUsers,
    canManageSystem,
    canManageMultipleLocations,
    canManageStore,
    canSuperviseStaff,
    canProcessTransactions,
    canManageInventory,
    canViewReports,
    
    // Role management
    getAccessibleRoles,
    canAssignRole,
    getRoleHierarchy,
    getUserRolesWithInfo,
  };
};