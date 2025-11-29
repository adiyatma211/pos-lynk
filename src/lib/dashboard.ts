import { apiFetch } from './api';

export type DashboardSummary = {
  todayTransactionsCount: number;
  todayRevenue: number;
  topProduct: string | null;
  weeklyTrend: Array<{
    label: string;
    total: number;
  }>;
  maxWeeklyTotal: number;
  latestTransactions: Array<{
    id: string;
    code: string;
    subtotal: number;
    total: number;
    paid: number;
    change: number;
    itemCount: number;
    createdAt: string;
    items?: Array<{
      id: string;
      productId: string;
      name: string;
      price: number;
      qty: number;
    }>;
  }>;
  totalRevenue: number;
  averageOrder: number;
  totalTransactions: number;
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/dashboard/summary');
}

// Helper function to initialize dashboard data
let dashboardRefreshCallback: (() => void) | null = null;

export const setDashboardRefreshCallback = (callback: () => void) => {
  dashboardRefreshCallback = callback;
};

export const triggerDashboardRefresh = () => {
  if (dashboardRefreshCallback) {
    dashboardRefreshCallback();
  }
};
