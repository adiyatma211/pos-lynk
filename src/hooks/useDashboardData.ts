import { useState, useEffect } from 'react';
import dashboardService from '@/services/dashboardService';
import { useAPI } from '@/utils/config';
import type { Transaction } from '@/types/pos';

export interface DashboardData {
  todayTransactionsCount: number;
  todayRevenue: number;
  topProduct: string;
  weeklyTrend: Array<{
    label: string;
    total: number;
  }>;
  maxWeeklyTotal: number;
  latestTransactions: Transaction[];
  totalRevenue: number;
  averageOrder: number;
  totalTransactions: number;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldUseAPI = useAPI();

  const fetchDashboardData = async () => {
    if (!shouldUseAPI) return;

    setIsLoading(true);
    setError(null);

    try {
      const summary = await dashboardService.getSummary();

      // Transform data to match frontend format
      const transformedData: DashboardData = {
        todayTransactionsCount: summary.todayTransactions || 0,
        todayRevenue: summary.todayRevenue || 0,
        topProduct: summary.topSellingProducts?.[0]?.name || '-',
        weeklyTrend: generateWeeklyTrend(summary),
        maxWeeklyTotal: calculateMaxWeeklyTotal(summary),
        latestTransactions: transformRecentTransactions(summary.recentTransactions),
        totalRevenue: summary.totalRevenue || 0,
        averageOrder: summary.averageOrder || 0, // Use API data
        totalTransactions: summary.totalTransactions || 0,
      };

      setData(transformedData);
    } catch (err: any) {
      console.error('Dashboard API error:', err);
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for data transformation
  const generateWeeklyTrend = (summary: any) => {
    const today = new Date();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const weeklyTrend = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];

      // For now, generate dummy data since backend doesn't provide daily breakdown
      // In production, this should come from the backend API
      weeklyTrend.push({
        label: i === 0 ? 'Hari Ini' : dayName,
        total: i === 0 ? (summary.todayRevenue || 0) : Math.floor(Math.random() * 50000), // Dummy data
      });
    }

    return weeklyTrend;
  };

  const calculateMaxWeeklyTotal = (summary: any) => {
    // Use today's revenue as a base for max weekly total
    // In a real implementation, backend should provide actual weekly breakdown
    return Math.max(summary.todayRevenue || 0, 50000); // Minimum 50k or today's revenue
  };

  const transformRecentTransactions = (transactions: any[]) => {
    return transactions.map(trx => ({
      id: trx.code,
      code: trx.code,
      createdAt: trx.createdAt,
      items: [], // Backend summary doesn't include items
      subtotal: trx.total,
      total: trx.total,
      paid: trx.total,
      change: 0,
    }));
  };

  useEffect(() => {
    if (shouldUseAPI) {
      fetchDashboardData();
    }
  }, [shouldUseAPI]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
};