import apiClient from './api';
import type { StockLog } from '@/types/pos';
import { StorageService } from './StorageService';
import { useAPI } from '@/utils/config';

export type CreateStockAdjustmentRequest = {
  product_id: number;
  type: 'in' | 'out';
  amount: number;
  note?: string;
};

export type StockLogResponse = {
  id: number;
  productId: number;        // From backend API
  productName: string;      // From backend API
  transactionCode?: string;  // From backend API
  type: 'in' | 'out';
  amount: number;
  note: string;
  createdAt: string;        // From backend API
  updatedAt?: string;
};

class StockService {
  private endpoint = '/stock-logs';

  private shouldUseAPI(): boolean {
    return useAPI();
  }

  // Transform backend response to frontend format
  private transformStockLog(backendLog: StockLogResponse): StockLog {
    return {
      id: backendLog.id.toString(),
      productId: backendLog.productId.toString(),  // Fixed: use camelCase from backend
      type: backendLog.type,
      amount: backendLog.amount,
      note: backendLog.note,
      createdAt: backendLog.createdAt,  // Fixed: use camelCase from backend
    };
  }

  private transformStockLogArray(logs: StockLogResponse[]): StockLog[] {
    return logs
      .filter(log => log && typeof log === 'object')
      .map(this.transformStockLog);
  }

  // Hybrid method: Get all stock logs
  async getStockLogs(params?: {
    product_id?: string;
    limit?: number;
  }): Promise<StockLog[]> {
    if (this.shouldUseAPI()) {
      try {
        const searchParams = new URLSearchParams();

        if (params?.product_id) {
          searchParams.append('product_id', params.product_id);
        }
        if (params?.limit) {
          searchParams.append('limit', params.limit.toString());
        }

        const url = searchParams.toString() ? `${this.endpoint}?${searchParams}` : this.endpoint;

        const response = await apiClient.get<StockLogResponse[]>(url);

        let logsData: StockLogResponse[];

        // Handle different API response formats
        if (Array.isArray(response)) {
          logsData = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          logsData = (response as any).data;  // Backend returns: { data: [...] }
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && Array.isArray((response as any).data.data)) {
          logsData = (response as any).data.data;
        } else {
          console.warn('[StockService] Unexpected API response format:', response);
          return StorageService.getStockLogs(); // Fallback to localStorage
        }

        if (!Array.isArray(logsData)) {
          console.warn('[StockService] Stock logs data is not an array:', logsData);
          return StorageService.getStockLogs(); // Fallback to localStorage
        }

        return this.transformStockLogArray(logsData);
      } catch (error) {
        console.error('[StockService] Error fetching stock logs from API, falling back to localStorage:', error);
        return StorageService.getStockLogs();
      }
    } else {
      return StorageService.getStockLogs();
    }
  }

  // Hybrid method: Create stock adjustment
  async createStockAdjustment(data: {
    productId: string;
    type: 'in' | 'out';
    amount: number;
    note?: string;
  }): Promise<void> {
    try {
      if (this.shouldUseAPI()) {
        // API Implementation
        const apiRequest: CreateStockAdjustmentRequest = {
          product_id: parseInt(data.productId),
          type: data.type,
          amount: data.amount,
          note: data.note || 'Penyesuaian stok manual',
        };

        const response = await apiClient.post<StockLogResponse>(this.endpoint, apiRequest);

        let logData: StockLogResponse;
        if (response && typeof response === 'object' && 'id' in response && (response as StockLogResponse).id) {
          logData = response as StockLogResponse;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && (response as any).data.id) {
          logData = (response as any).data;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && (response as any).data.data && typeof (response as any).data.data === 'object' && (response as any).data.data.id) {
          logData = (response as any).data.data;
        } else {
          throw new Error('Invalid stock log response from server');
        }

        console.log('[StockService] Stock adjustment created successfully:', logData);
      } else {
        // Local Storage Implementation
        const newStockLog: StockLog = {
          id: `SL-${Date.now()}`,
          productId: data.productId,
          type: data.type,
          amount: data.amount,
          note: data.note || 'Penyesuaian stok manual',
          createdAt: new Date().toISOString(),
        };

        const stockLogs = StorageService.getStockLogs();
        StorageService.setStockLogs([newStockLog, ...stockLogs]);
      }
    } catch (error: any) {
      console.error('[StockService] Error creating stock adjustment:', error);
      throw error;
    }
  }

  // Get stock logs by product ID
  async getStockLogsByProductId(productId: string): Promise<StockLog[]> {
    return this.getStockLogs({ product_id: productId });
  }

  // Get latest stock logs
  async getLatestStockLogs(limit: number = 20): Promise<StockLog[]> {
    return this.getStockLogs({ limit });
  }

  // Utility methods
  async getStockLogById(id: string): Promise<StockLog | undefined> {
    const stockLogs = await this.getStockLogs();
    return stockLogs.find(log => log.id === id);
  }

  // Sync stock logs from API to localStorage (for offline support)
  async syncStockLogsFromAPI(limit?: number): Promise<void> {
    if (!this.shouldUseAPI()) {
      return;
    }

    try {
      const apiStockLogs = await this.getStockLogs({ limit });
      const localStockLogs = StorageService.getStockLogs();

      // Merge API stock logs with local ones, avoiding duplicates
      const existingIds = new Set(localStockLogs.map(log => log.id));
      const newLogs = apiStockLogs.filter(log => !existingIds.has(log.id));

      if (newLogs.length > 0) {
        const mergedLogs = [...newLogs, ...localStockLogs];
        StorageService.setStockLogs(mergedLogs);
        console.log(`[StockService] Synced ${newLogs.length} new stock logs from API`);
      }
    } catch (error) {
      console.error('[StockService] Error syncing stock logs from API:', error);
    }
  }

  // Check API connectivity
  async checkAPIConnectivity(): Promise<boolean> {
    if (!this.shouldUseAPI()) {
      return false;
    }

    try {
      await apiClient.get('/health');
      return true;
    } catch (error) {
      console.error('[StockService] API connectivity check failed:', error);
      return false;
    }
  }
}

export default new StockService();