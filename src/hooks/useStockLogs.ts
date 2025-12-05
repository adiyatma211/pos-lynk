import { useState, useEffect } from 'react';
import stockService from '@/services/StockService';
import { useAPI } from '@/utils/config';
import type { StockLog } from '@/types/pos';

export const useStockLogs = (productId?: string, limit?: number) => {
  const [data, setData] = useState<StockLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldUseAPI = useAPI();

  const fetchStockLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (productId) params.product_id = productId;
      if (limit) params.limit = limit;

      const stockLogs = await stockService.getStockLogs(params);
      setData(stockLogs);
    } catch (err: any) {
      console.error('Stock Logs API error:', err);
      setError(err.message || 'Gagal memuat data riwayat stok');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStockLogs = () => {
    fetchStockLogs();
  };

  useEffect(() => {
    fetchStockLogs();
  }, [shouldUseAPI, productId, limit]);

  return {
    data,
    isLoading,
    error,
    refetch: refreshStockLogs,
  };
};