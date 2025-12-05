import apiClient from './api';
import type { Transaction, TransactionItem, StockLog, Product } from '@/types/pos';
import { StorageService, generateId } from './StorageService';
import { useAPI } from '@/utils/config';
import { receiptService } from '@/services/receiptService';
import showToast from '@/components/ui/Toast';

export interface TransactionData {
  items: TransactionItem[];
  subtotal: number;
  total: number;
  paid: number;
  change: number;
}

export interface CartItem extends TransactionItem {
  productId: string;
}

// API Types based on backend TransactionResource
export interface TransactionItemRequest {
  product_id: number;
  qty: number;
}

export interface CreateTransactionRequest {
  items: TransactionItemRequest[];
  paid: number;
}

export interface TransactionItemResponse {
  id: number;
  productId: number;        // From backend TransactionItemResource
  name: string;            // From backend TransactionItemResource
  price: number;
  qty: number;
}

export interface TransactionResponse {
  id: string;           // Transaction code (from backend)
  code: string;         // Transaction code
  referenceId: number;  // Database ID
  subtotal: number;
  total: number;
  paid: number;
  change: number;
  itemCount: number;
  createdAt: string;
  items?: TransactionItemResponse[];
}

class TransactionService {
  private endpoint = '/transactions';

  private shouldUseAPI(): boolean {
    return useAPI();
  }

  // Transform backend response to frontend format
  private transformTransaction(backendTransaction: TransactionResponse): Transaction {
    const items: TransactionItem[] = (backendTransaction.items || []).map((item) => ({
      productId: item.productId.toString(),  // Fixed: use productId from backend
      name: item.name,                     // Fixed: use name from backend
      price: item.price,
      qty: item.qty,
    }));

    return {
      id: backendTransaction.id, // Use transaction code as ID
      referenceId: backendTransaction.referenceId, // Include referenceId (numeric database ID)
      createdAt: backendTransaction.createdAt,
      items,
      subtotal: backendTransaction.subtotal,
      total: backendTransaction.total,
      paid: backendTransaction.paid,
      change: backendTransaction.change,
    };
  }

  private transformTransactionArray(transactions: TransactionResponse[]): Transaction[] {
    return transactions
      .filter(transaction => transaction && typeof transaction === 'object')
      .map(this.transformTransaction);
  }

  // Get all transactions with optional filters
  async getTransactions(params?: {
    range?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    per_page?: number;
  }): Promise<Transaction[]> {
    if (this.shouldUseAPI()) {
      try {
        const searchParams = new URLSearchParams();

        if (params?.range) {
          searchParams.append('range', params.range);
        }
        if (params?.start_date) {
          searchParams.append('start_date', params.start_date);
        }
        if (params?.end_date) {
          searchParams.append('end_date', params.end_date);
        }
        if (params?.limit) {
          searchParams.append('limit', params.limit.toString());
        }
        if (params?.per_page) {
          searchParams.append('per_page', params.per_page.toString());
        }

        const url = searchParams.toString() ? `${this.endpoint}?${searchParams}` : this.endpoint;

        const response = await apiClient.get(url);

        let transactionsData: TransactionResponse[];

        // Handle different API response formats
        if (Array.isArray(response)) {
          transactionsData = response;
        } else if (response && Array.isArray(response.data)) {
          transactionsData = response.data;
        } else if (response && response.data && Array.isArray(response.data.data)) {
          transactionsData = response.data.data;
        } else {
          console.warn('[TransactionService] Unexpected API response format:', response);
          return StorageService.getTransactions(); // Fallback to localStorage
        }

        if (!Array.isArray(transactionsData)) {
          console.warn('[TransactionService] Transactions data is not an array:', transactionsData);
          return StorageService.getTransactions(); // Fallback to localStorage
        }

        return this.transformTransactionArray(transactionsData);
      } catch (error) {
        console.error('[TransactionService] Error fetching transactions from API, falling back to localStorage:', error);
        return StorageService.getTransactions();
      }
    } else {
      return StorageService.getTransactions();
    }
  }

  // Get transaction by ID/Code
  async getTransactionById(id: string): Promise<Transaction | undefined> {
    if (this.shouldUseAPI()) {
      try {
        const response = await apiClient.get<TransactionResponse>(`${this.endpoint}/${id}`);

        let transactionData: TransactionResponse;
        // Handle both direct response and wrapped response formats
        if (response && typeof response === 'object') {
          if ('data' in response && (response as any).data) {
            // Response is wrapped in "data" key by Laravel Resource
            transactionData = (response as any).data;
          } else if ('id' in response) {
            // Direct response
            transactionData = response as TransactionResponse;
          } else {
            console.warn('[TransactionService] Unexpected transaction response format:', response);
            // Fallback to localStorage search
            const transactions = await StorageService.getTransactions();
            return transactions.find(trx => trx.id === id);
          }
        } else {
          console.warn('[TransactionService] Invalid response:', response);
          const transactions = await StorageService.getTransactions();
          return transactions.find(trx => trx.id === id);
        }

        return this.transformTransaction(transactionData);
      } catch (error) {
        console.error('[TransactionService] Error fetching transaction from API, falling back to localStorage:', error);
        // Fallback to localStorage search
        const transactions = await StorageService.getTransactions();
        return transactions.find(trx => trx.id === id);
      }
    } else {
      // localStorage implementation
      const transactions = await StorageService.getTransactions();
      return transactions.find(trx => trx.id === id);
    }
  }

  // Create and save transaction
  async createTransaction(data: TransactionData): Promise<Transaction> {
    try {
      if (this.shouldUseAPI()) {
        // API Implementation
        const apiRequest: CreateTransactionRequest = {
          items: data.items.map((item) => ({
            product_id: parseInt(item.productId),
            qty: item.qty,
          })),
          paid: data.paid,
        };

        const response = await apiClient.post<TransactionResponse>(this.endpoint, apiRequest);

        let transactionData: TransactionResponse;

        // Handle response structure from Laravel API with TransactionResource
        if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && (response as any).data.id) {
          // Response is wrapped in "data" key by Laravel Resource
          transactionData = (response as any).data;
        } else if (response && typeof response === 'object' && 'id' in response && (response as TransactionResponse).id) {
          // Direct response
          transactionData = response as TransactionResponse;
        } else {
          console.error('[TransactionService] Unexpected response structure:', response);
          throw new Error('Invalid transaction response from server');
        }

        const transformedTransaction = this.transformTransaction(transactionData);

        // Generate receipt PDF (async, don't wait for it)
        receiptService.generateReceipt({
          transaction: transformedTransaction,
        }).catch((error) => {
          console.error('Failed to generate receipt:', error);
          // Show user-visible error notification for receipt generation failure
          showToast.error(
            "Gagal Membuat Struk",
            error?.message || "Struk pembelian gagal dibuat. Silakan coba lagi atau hubungi admin."
          );
        });

        showToast.success("Transaksi tersimpan");
        return transformedTransaction;
      } else {
        // Local Storage Implementation
        const now = new Date().toISOString();
        const newTransaction: Transaction = {
          id: `TRX-${now.replace(/\D/g, "").slice(-8)}`,
          createdAt: now,
          items: data.items,
          subtotal: data.subtotal,
          total: data.total,
          paid: data.paid,
          change: data.change,
        };

        await this.saveTransactionLocally(newTransaction, data.items);

        showToast.success("Transaksi tersimpan");
        return newTransaction;
      }
    } catch (error: any) {
      console.log('[TransactionService] Transaction failed:', error?.message || error);

      let errorMessage = 'Gagal menyimpan transaksi';
      let errorDescription = '';

      if (error && error.data) {
        // Handle API validation errors (like stock validation)
        if (error.data.message) {
          errorMessage = error.data.message;
        }

        // Handle Laravel validation errors
        if (error.data.errors) {
          const validationErrors = [];
          for (const [field, messages] of Object.entries(error.data.errors)) {
            if (Array.isArray(messages)) {
              validationErrors.push(...messages);
            } else if (typeof messages === 'string') {
              validationErrors.push(messages);
            }
          }
          if (validationErrors.length > 0) {
            errorDescription = validationErrors.join(', ');
          }
        }
      } else if (error && error.message) {
        errorMessage = error.message;
      }

      showToast.error(errorMessage, errorDescription);
      throw error;
    }
  }

  // Save transaction locally and update stock
  private async saveTransactionLocally(transaction: Transaction, items: CartItem[]): Promise<void> {
    // Save transaction
    const transactions = StorageService.getTransactions();
    StorageService.setTransactions([transaction, ...transactions]);

    // Update product stock
    await this.updateProductStock(items);

    // Create stock logs
    const stockLogs = items.map((item) => ({
      id: generateId(),
      productId: item.productId,
      type: "out" as const,
      amount: item.qty,
      note: `Penjualan ${transaction.id}`,
      createdAt: transaction.createdAt,
    }));

    const existingStockLogs = StorageService.getStockLogs();
    StorageService.setStockLogs([...stockLogs, ...existingStockLogs]);

    // Generate receipt PDF
    receiptService.generateReceipt({
      transaction
    }).catch(error => {
      console.error('Failed to generate receipt:', error);
      // Show user-visible error notification for receipt generation failure
      showToast.error(
        "Gagal Membuat Struk",
        error?.message || "Struk pembelian gagal dibuat. Silakan coba lagi atau hubungi admin."
      );
    });
  }

  // Update product stock after transaction
  private async updateProductStock(items: CartItem[]): Promise<void> {
    const products = StorageService.getProducts();
    const updatedProducts = products.map((product) => {
      const cartItem = items.find((item) => item.productId === product.id);
      if (!cartItem) return product;

      return {
        ...product,
        stock: Math.max(product.stock - cartItem.qty, 0)
      };
    });

    StorageService.setProducts(updatedProducts);
  }

  // Get today's transactions
  async getTodayTransactions(): Promise<Transaction[]> {
    if (this.shouldUseAPI()) {
      try {
        // Use API with range filter for better performance
        return await this.getTransactions({ range: 'today' });
      } catch (error) {
        console.error('[TransactionService] Error fetching today transactions from API, falling back to client-side filtering:', error);
        // Fallback to client-side filtering
        const transactions = await this.getTransactions();
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return transactions.filter((trx) => new Date(trx.createdAt) >= startOfDay);
      }
    } else {
      // Local storage implementation
      const transactions = await this.getTransactions();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return transactions.filter((trx) => new Date(trx.createdAt) >= startOfDay);
    }
  }

  // Get today's revenue
  async getTodayRevenue(): Promise<number> {
    const todayTransactions = await this.getTodayTransactions();
    return todayTransactions.reduce((sum, trx) => sum + trx.total, 0);
  }

  // Get total revenue
  async getTotalRevenue(): Promise<number> {
    const transactions = await this.getTransactions();
    return transactions.reduce((sum, trx) => sum + trx.total, 0);
  }

  // Get latest transactions (limit)
  async getLatestTransactions(limit: number = 5): Promise<Transaction[]> {
    if (this.shouldUseAPI()) {
      try {
        // Use API with limit parameter for better performance
        return await this.getTransactions({ limit });
      } catch (error) {
        console.error('[TransactionService] Error fetching latest transactions from API, falling back to client-side filtering:', error);
        // Fallback to client-side filtering
        const transactions = await this.getTransactions();
        return transactions.slice(0, limit);
      }
    } else {
      // Local storage implementation
      const transactions = await this.getTransactions();
      return transactions.slice(0, limit);
    }
  }

  // Get top selling product
  async getTopSellingProduct(): Promise<string> {
    const transactions = await this.getTransactions();
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

  // Generate weekly trend data
  async getWeeklyTrend(): Promise<{ label: string; total: number }[]> {
    const transactions = await this.getTransactions();
    const trend: { label: string; total: number }[] = [];
    const base = new Date();

    for (let i = 6; i >= 0; i -= 1) {
      const target = new Date(base);
      target.setDate(base.getDate() - i);
      const start = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const total = transactions
        .filter((trx) => {
          const date = new Date(trx.createdAt);
          return date >= start && date < end;
        })
        .reduce((sum, trx) => sum + trx.total, 0);

      trend.push({
        label: start.toLocaleDateString("id-ID", { weekday: "short" }),
        total
      });
    }

    return trend;
  }

  // Share transaction via WhatsApp
  shareTransactionWhatsApp(transaction: Transaction): void {
    const lines = [
      `Struk Sentosa POS`,
      `ID: ${transaction.id}`,
      `Tanggal: ${new Date(transaction.createdAt).toLocaleString('id-ID')}`,
      "",
    ];

    transaction.items.forEach((item) =>
      lines.push(`${item.name} x${item.qty} = ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price * item.qty)}`),
    );

    lines.push("", `Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(transaction.total)}`, `Tunai: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(transaction.paid)}`);
    lines.push(`Kembalian: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(transaction.change)}`);

    const url = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank");
  }

  // Validate cart before checkout
  validateCart(items: CartItem[]): { isValid: boolean; error?: string } {
    if (!items.length) {
      return { isValid: false, error: "Keranjang kosong" };
    }

    for (const item of items) {
      if (item.qty <= 0) {
        return { isValid: false, error: "Quantity harus lebih dari 0" };
      }
    }

    return { isValid: true };
  }

  // Calculate cart totals
  calculateCartTotals(items: CartItem[]): { subtotal: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return { subtotal, total: subtotal };
  }

  // Format currency helper
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format date time helper
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // Sync transactions from API to localStorage (for offline support)
  async syncTransactionsFromAPI(limit?: number): Promise<void> {
    if (!this.shouldUseAPI()) {
      return;
    }

    try {
      const apiTransactions = await this.getTransactions({ limit });
      const localTransactions = StorageService.getTransactions();

      // Merge API transactions with local ones, avoiding duplicates
      const existingCodes = new Set(localTransactions.map(trx => trx.id));
      const newTransactions = apiTransactions.filter(trx => !existingCodes.has(trx.id));

      if (newTransactions.length > 0) {
        const mergedTransactions = [...newTransactions, ...localTransactions];
        StorageService.setTransactions(mergedTransactions);
        console.log(`[TransactionService] Synced ${newTransactions.length} new transactions from API`);
      }
    } catch (error) {
      console.error('[TransactionService] Error syncing transactions from API:', error);
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
      console.error('[TransactionService] API connectivity check failed:', error);
      return false;
    }
  }
}

export default new TransactionService();