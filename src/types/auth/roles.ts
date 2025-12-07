/**
 * Role hierarchy for POS authentication system
 * Ordered from highest to lowest privilege level
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  REGIONAL_MANAGER = 'regional_manager',
  STORE_MANAGER = 'store_manager',
  SUPERVISOR = 'supervisor',
  CASHIER = 'cashier',
  STOCK_KEEPER = 'stock_keeper',
  VIEWER = 'viewer'
}

/**
 * Role hierarchy levels for access control
 * Higher number = higher privilege
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.REGIONAL_MANAGER]: 80,
  [UserRole.STORE_MANAGER]: 60,
  [UserRole.SUPERVISOR]: 40,
  [UserRole.CASHIER]: 30,
  [UserRole.STOCK_KEEPER]: 25,
  [UserRole.VIEWER]: 10
};

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.REGIONAL_MANAGER]: 'Regional Manager',
  [UserRole.STORE_MANAGER]: 'Store Manager',
  [UserRole.SUPERVISOR]: 'Supervisor',
  [UserRole.CASHIER]: 'Cashier',
  [UserRole.STOCK_KEEPER]: 'Stock Keeper',
  [UserRole.VIEWER]: 'Viewer'
};

/**
 * Role descriptions for UI tooltips/help text
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Full system access across all regions and stores',
  [UserRole.REGIONAL_MANAGER]: 'Manage multiple stores within a region',
  [UserRole.STORE_MANAGER]: 'Manage single store operations and staff',
  [UserRole.SUPERVISOR]: 'Oversee daily operations and staff performance',
  [UserRole.CASHIER]: 'Process transactions and handle customer payments',
  [UserRole.STOCK_KEEPER]: 'Manage inventory and stock adjustments',
  [UserRole.VIEWER]: 'Read-only access to reports and dashboards'
};

/**
 * Permission definitions for the POS system
 */
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Product permissions
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Category permissions
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_EDIT: 'categories.edit',
  CATEGORIES_DELETE: 'categories.delete',
  
  // Transaction permissions
  TRANSACTIONS_VIEW: 'transactions.view',
  TRANSACTIONS_CREATE: 'transactions.create',
  TRANSACTIONS_EDIT: 'transactions.edit',
  TRANSACTIONS_DELETE: 'transactions.delete',
  
  // Receipt permissions
  RECEIPTS_VIEW: 'receipts.view',
  RECEIPTS_GENERATE: 'receipts.generate',
  RECEIPTS_DOWNLOAD: 'receipts.download',
  RECEIPTS_UPLOAD: 'receipts.upload',
  RECEIPTS_DELETE: 'receipts.delete',
  
  // Stock permissions
  STOCK_VIEW: 'stock.view',
  STOCK_ADJUST: 'stock.adjust',
  
  // Reports permissions
  REPORTS_SALES: 'reports.sales',
  REPORTS_INVENTORY: 'reports.inventory',
  REPORTS_FINANCIAL: 'reports.financial',
  
  // User management permissions
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // System permissions
  SYSTEM_VIEW: 'system.view',
  SYSTEM_EDIT: 'system.edit',
} as const;

/**
 * Permission groups by module
 */
export const PERMISSION_GROUPS = {
  DASHBOARD: [PERMISSIONS.DASHBOARD_VIEW],
  
  PRODUCTS: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRODUCTS_DELETE,
  ],
  
  CATEGORIES: [
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_EDIT,
    PERMISSIONS.CATEGORIES_DELETE,
  ],
  
  TRANSACTIONS: [
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.TRANSACTIONS_EDIT,
    PERMISSIONS.TRANSACTIONS_DELETE,
  ],
  
  RECEIPTS: [
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_GENERATE,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.RECEIPTS_UPLOAD,
    PERMISSIONS.RECEIPTS_DELETE,
  ],
  
  STOCK: [
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
  ],
  
  REPORTS: [
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_INVENTORY,
    PERMISSIONS.REPORTS_FINANCIAL,
  ],
  
  USERS: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
  ],
  
  SYSTEM: [
    PERMISSIONS.SYSTEM_VIEW,
    PERMISSIONS.SYSTEM_EDIT,
  ],
} as const;

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PERMISSIONS),
  
  [UserRole.REGIONAL_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_EDIT,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_INVENTORY,
    PERMISSIONS.REPORTS_FINANCIAL,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
  ],
  
  [UserRole.STORE_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_EDIT,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_GENERATE,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_INVENTORY,
    PERMISSIONS.USERS_VIEW,
  ],
  
  [UserRole.SUPERVISOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_GENERATE,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_INVENTORY,
  ],
  
  [UserRole.CASHIER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_GENERATE,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
  ],
  
  [UserRole.STOCK_KEEPER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.REPORTS_INVENTORY,
  ],
  
  [UserRole.VIEWER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_INVENTORY,
    PERMISSIONS.REPORTS_FINANCIAL,
  ],
};