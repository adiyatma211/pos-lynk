import type { Transaction, Product, Category, StockLog } from '@/types/pos';

export interface WeeklyTrendPoint {
  label: string;
  total: number;
  date: Date;
}

export interface ProductSalesData {
  productId: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
}

export interface CategoryStats {
  categoryId: string;
  name: string;
  productCount: number;
  totalStock: number;
  totalRevenue: number;
}

export interface SalesReport {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  topSellingProduct: string;
  weeklyTrend: WeeklyTrendPoint[];
  productSales: ProductSalesData[];
  categoryStats: CategoryStats[];
}

export class DataTransformationUtils {
  // Generate weekly trend data for the last 7 days
  static generateWeeklyTrend(transactions: Transaction[]): WeeklyTrendPoint[] {
    const trend: WeeklyTrendPoint[] = [];
    const base = new Date();

    for (let i = 6; i >= 0; i -= 1) {
      const target = new Date(base);
      target.setDate(base.getDate() - i);
      const start = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const total = transactions
        .filter((trx) => {
          const trxDate = new Date(trx.createdAt);
          return trxDate >= start && trxDate < end;
        })
        .reduce((sum, trx) => sum + trx.total, 0);

      trend.push({
        label: i === 0 ? 'Hari Ini' : start.toLocaleDateString("id-ID", { weekday: "short" }),
        total,
        date: start,
      });
    }

    return trend;
  }

  // Calculate max weekly total for chart scaling
  static calculateMaxWeeklyTotal(weeklyTrend: WeeklyTrendPoint[]): number {
    return Math.max(1, ...weeklyTrend.map(point => point.total));
  }

  // Get today's transactions
  static getTodayTransactions(transactions: Transaction[]): Transaction[] {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return transactions.filter((trx) => new Date(trx.createdAt) >= startOfDay);
  }

  // Calculate today's revenue
  static calculateTodayRevenue(transactions: Transaction[]): number {
    const todayTransactions = this.getTodayTransactions(transactions);
    return todayTransactions.reduce((sum, trx) => sum + trx.total, 0);
  }

  // Get top selling product
  static getTopSellingProduct(transactions: Transaction[]): string {
    const soldMap = new Map<string, { name: string; qty: number }>();

    transactions.forEach((trx) => {
      trx.items.forEach((item) => {
        const current = soldMap.get(item.productId);
        if (current) {
          current.qty += item.qty;
          soldMap.set(item.productId, current);
        } else {
          soldMap.set(item.productId, { name: item.name, qty: item.qty });
        }
      });
    });

    let best: { name: string; qty: number } | null = null;
    for (const value of soldMap.values()) {
      if (!best || value.qty > best.qty) {
        best = value;
      }
    }

    return best?.name ?? "-";
  }

  // Get latest transactions
  static getLatestTransactions(transactions: Transaction[], limit: number = 5): Transaction[] {
    return transactions.slice(0, limit);
  }

  // Calculate total revenue
  static calculateTotalRevenue(transactions: Transaction[]): number {
    return transactions.reduce((sum, trx) => sum + trx.total, 0);
  }

  // Calculate average order value
  static calculateAverageOrder(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;
    const totalRevenue = this.calculateTotalRevenue(transactions);
    return totalRevenue / transactions.length;
  }

  // Generate product sales report
  static generateProductSalesReport(transactions: Transaction[]): ProductSalesData[] {
    const salesMap = new Map<string, ProductSalesData>();

    transactions.forEach((trx) => {
      trx.items.forEach((item) => {
        const current = salesMap.get(item.productId);
        if (current) {
          current.totalSold += item.qty;
          current.totalRevenue += item.price * item.qty;
        } else {
          salesMap.set(item.productId, {
            productId: item.productId,
            name: item.name,
            totalSold: item.qty,
            totalRevenue: item.price * item.qty,
          });
        }
      });
    });

    return Array.from(salesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // Generate category statistics
  static generateCategoryStats(
    products: Product[],
    categories: Category[],
    transactions: Transaction[]
  ): CategoryStats[] {
    return categories.map(category => {
      const categoryProducts = products.filter(product => product.categoryId === category.id);
      const productIds = categoryProducts.map(p => p.id);

      // Calculate total stock
      const totalStock = categoryProducts.reduce((sum, product) => sum + product.stock, 0);

      // Calculate total revenue from transactions
      const totalRevenue = transactions.reduce((sum, trx) => {
        const categoryItems = trx.items.filter(item => productIds.includes(item.productId));
        return sum + categoryItems.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0);
      }, 0);

      return {
        categoryId: category.id,
        name: category.name,
        productCount: categoryProducts.length,
        totalStock,
        totalRevenue,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // Filter transactions by date range
  static filterTransactionsByDateRange(
    transactions: Transaction[],
    dateRange: { start: string; end: string }
  ): Transaction[] {
    if (!dateRange.start && !dateRange.end) return transactions;

    return transactions.filter((trx) => {
      const trxDate = new Date(trx.createdAt).setHours(0, 0, 0, 0);
      const startDate = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : -Infinity;
      const endDate = dateRange.end ? new Date(dateRange.end).setHours(0, 0, 0, 0) : Infinity;

      return trxDate >= startDate && trxDate <= endDate;
    });
  }

  // Generate comprehensive sales report
  static generateSalesReport(
    transactions: Transaction[],
    products: Product[],
    categories: Category[]
  ): SalesReport {
    const todayTransactions = this.getTodayTransactions(transactions);
    const weeklyTrend = this.generateWeeklyTrend(transactions);

    return {
      totalRevenue: this.calculateTotalRevenue(transactions),
      totalTransactions: transactions.length,
      averageOrderValue: this.calculateAverageOrder(transactions),
      topSellingProduct: this.getTopSellingProduct(transactions),
      weeklyTrend,
      productSales: this.generateProductSalesReport(transactions),
      categoryStats: this.generateCategoryStats(products, categories, transactions),
    };
  }

  // Search products with multiple criteria
  static searchProducts(
    products: Product[],
    criteria: {
      searchTerm?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
    }
  ): Product[] {
    return products.filter(product => {
      // Search term filter
      if (criteria.searchTerm) {
        const searchTerm = criteria.searchTerm.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(searchTerm);
        if (!matchesName) return false;
      }

      // Category filter
      if (criteria.categoryId && criteria.categoryId !== 'all') {
        if (product.categoryId !== criteria.categoryId) return false;
      }

      // Price range filter
      if (criteria.minPrice !== undefined) {
        if (product.price < criteria.minPrice) return false;
      }
      if (criteria.maxPrice !== undefined) {
        if (product.price > criteria.maxPrice) return false;
      }

      // Stock filter
      if (criteria.inStock !== undefined) {
        const hasStock = product.stock > 0;
        if (criteria.inStock !== hasStock) return false;
      }

      return true;
    });
  }

  // Group transactions by date
  static groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((groups, trx) => {
      const date = new Date(trx.createdAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(trx);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }

  // Calculate stock changes from logs
  static calculateStockChanges(stockLogs: StockLog[]): Record<string, number> {
    return stockLogs.reduce((changes, log) => {
      const change = log.type === 'in' ? log.amount : -log.amount;
      changes[log.productId] = (changes[log.productId] || 0) + change;
      return changes;
    }, {} as Record<string, number>);
  }
}