import type { StockLog, Transaction } from '@/types/pos';
import { apiFetch } from './api';
import { triggerDashboardRefresh } from './dashboard';

type ApiTransactionItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
};

type ApiTransaction = {
  id: string;
  code: string;
  referenceId: string;
  subtotal: number;
  total: number;
  paid: number;
  change: number;
  createdAt: string;
  items: ApiTransactionItem[];
};

type TransactionListResponse = {
  data: ApiTransaction[];
};

type TransactionResponse = {
  data: ApiTransaction;
};

type StockLogResponse = {
  data: Array<{
    id: string;
    productId: string;
    productName?: string;
    transactionCode?: string;
    type: 'in' | 'out';
    amount: number;
    note?: string | null;
    createdAt: string;
  }>;
};

const mapTransaction = (payload: ApiTransaction): Transaction => ({
  id: payload.id,
  createdAt: payload.createdAt,
  items: payload.items.map((item) => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    qty: item.qty,
  })),
  subtotal: payload.subtotal,
  total: payload.total,
  paid: payload.paid,
  change: payload.change,
});

export async function fetchTransactions(limit = 30): Promise<Transaction[]> {
  try {
    console.log('Fetching transactions:', { limit });
    const response = await apiFetch<{data: ApiTransaction[]}>(`/transactions?limit=${limit}`);
    console.log('Transactions API response:', response);
    
    // Handle API response format {data: [...]}
    let transactionData;
    if (response && typeof response === 'object' && Array.isArray(response.data)) {
      transactionData = response.data;
      console.log('Using response.data as transactions, length:', transactionData.length);
    } else if (Array.isArray(response)) {
      // Direct array response (fallback)
      transactionData = response;
      console.log('Using response as direct transactions array, length:', transactionData.length);
    } else {
      console.warn('Invalid transactions response format:', response);
      return [];
    }
    
    return transactionData.map(mapTransaction);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}

export async function createTransaction(payload: {
  items: Array<{ product_id: string; qty: number }>;
  paid: number;
}): Promise<Transaction> {
  const response = await apiFetch<TransactionResponse>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // Trigger dashboard refresh after creating a transaction
  triggerDashboardRefresh();
  return mapTransaction(response.data);
}

export async function fetchStockLogs(limit = 5): Promise<StockLog[]> {
  try {
    console.log('Fetching stock logs:', { limit });
    const response = await apiFetch<StockLogResponse>(`/stock-logs?limit=${limit}`);
    console.log('Stock logs API response:', response);
    
    // Handle API response format {data: [...]}
    let stockLogData;
    if (response && typeof response === 'object' && Array.isArray(response.data)) {
      stockLogData = response.data;
      console.log('Using response.data as stock logs, length:', stockLogData.length);
    } else if (Array.isArray(response)) {
      // Direct array response (fallback)
      stockLogData = response;
      console.log('Using response as direct stock logs array, length:', stockLogData.length);
    } else {
      console.warn('Invalid stock logs response format:', response);
      return [];
    }
    
    return stockLogData.map((item) => ({
      id: item.id,
      productId: item.productId,
      type: item.type,
      amount: item.amount,
      note: item.note ?? undefined,
      createdAt: item.createdAt,
    }));
  } catch (error) {
    console.error('Failed to fetch stock logs:', error);
    return [];
  }
}
