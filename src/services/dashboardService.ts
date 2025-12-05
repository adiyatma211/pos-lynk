import apiClient from './api';
import transactionService from './TransactionService';

export type DashboardSummary = {
  totalRevenue: number;
  totalTransactions: number;
  totalProducts: number;
  lowStockProducts: number;
  todayRevenue: number;
  todayTransactions: number;
  averageOrder: number;  // Added for rata-rata order
  weekRevenue: number;
  weekTransactions: number;
  monthRevenue: number;
  monthTransactions: number;
  topSellingProducts: Array<{
    name: string;
    totalSold?: number;
    revenue?: number;
  }>;
  recentTransactions: Array<{
    id: string;
    code: string;
    total: number;
    itemCount: number;
    createdAt: string;
  }>;
};

class DashboardService {
  private endpoint = '/dashboard';

  // Get dashboard summary (Hybrid API/LocalStorage approach)
  async getSummary(): Promise<DashboardSummary> {
    try {
      const response = await apiClient.get(`${this.endpoint}/summary`);

      // Transform backend response to match frontend expectations
      const summary = {
        totalRevenue: response.totalRevenue || response.total_revenue || 0,
        totalTransactions: response.totalTransactions || response.total_transactions || 0,
        totalProducts: response.totalProducts || response.total_products || 0,
        lowStockProducts: response.lowStockProducts || response.low_stock_products || 0,
        todayRevenue: response.todayRevenue || response.today_revenue || 0,
        todayTransactions: response.todayTransactionsCount || response.today_transactions || response.today_transactions_count || 0, // Fixed mapping
        averageOrder: response.averageOrder || response.average_order || 0, // Fixed mapping
        weekRevenue: response.weekRevenue || response.week_revenue || 0,
        weekTransactions: response.weekTransactions || response.week_transactions || 0,
        monthRevenue: response.monthRevenue || response.month_revenue || 0,
        monthTransactions: response.monthTransactions || response.month_transactions || 0,
        topSellingProducts: response.topProduct ? [{name: response.topProduct, totalSold: 1}] : response.topSellingProducts || [], // Fixed mapping
        recentTransactions: response.latestTransactions || response.recent_transactions || [], // Fixed mapping
      };

      return summary;
    } catch (error) {
      console.error('Error fetching dashboard summary from API, falling back to TransactionService:', error);

      // Fallback to TransactionService for dashboard data
      return await this.getSummaryFromTransactionService();
    }
  }

  // Fallback method using TransactionService
  private async getSummaryFromTransactionService(): Promise<DashboardSummary> {
    try {
      const [
        todayTransactions,
        todayRevenue,
        totalRevenue,
        totalTransactions,
        latestTransactions,
        weeklyTrend,
        topProduct
      ] = await Promise.all([
        transactionService.getTodayTransactions(),
        transactionService.getTodayRevenue(),
        transactionService.getTotalRevenue(),
        transactionService.getTransactions(),
        transactionService.getLatestTransactions(5),
        transactionService.getWeeklyTrend(),
        transactionService.getTopSellingProduct()
      ]);

      const averageOrder = totalTransactions.length > 0 ? Math.round(totalRevenue / totalTransactions.length) : 0;
      const maxWeeklyTotal = Math.max(...weeklyTrend.map(t => t.total), 0);

      return {
        totalRevenue,
        totalTransactions: totalTransactions.length,
        totalProducts: 0, // Would need ProductService integration
        lowStockProducts: 0, // Would need ProductService integration
        todayRevenue,
        todayTransactions: todayTransactions.length,
        averageOrder, // Added calculation
        weekRevenue: weeklyTrend.reduce((sum, day) => sum + day.total, 0),
        weekTransactions: totalTransactions.length, // Simplified
        monthRevenue: totalRevenue, // Simplified
        monthTransactions: totalTransactions.length, // Simplified
        topSellingProducts: topProduct !== "-" ? [{name: topProduct, totalSold: 1}] : [], // Use TransactionService data
        recentTransactions: latestTransactions.map(trx => ({
          id: trx.id,
          code: trx.id,
          total: trx.total,
          itemCount: trx.items.length,
          createdAt: trx.createdAt
        }))
      };
    } catch (error) {
      console.error('Error generating dashboard summary from TransactionService:', error);

      // Return empty summary as last resort
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        todayRevenue: 0,
        todayTransactions: 0,
        averageOrder: 0,
        weekRevenue: 0,
        weekTransactions: 0,
        monthRevenue: 0,
        monthTransactions: 0,
        topSellingProducts: [],
        recentTransactions: []
      };
    }
  }

  // Health check for API connectivity
  async healthCheck(): Promise<boolean> {
    try {
      await apiClient.healthCheck();
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

export default new DashboardService();