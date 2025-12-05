import type { Category, Product, Transaction, StockLog } from '@/types/pos';

const storageKeys = {
  categories: "poslynk-categories",
  products: "poslynk-products",
  transactions: "poslynk-transactions",
  stockLogs: "poslynk-stock-logs",
};

export const generateId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export class StorageService {
  static readFromStorage = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch (error) {
      console.error("Failed to read storage", error);
      return fallback;
    }
  };

  static persistToStorage = (key: string, value: unknown): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to write storage", error);
    }
  };

  // Categories
  static getCategories = (): Category[] => {
    const defaultCategories: Category[] = [
      { id: generateId(), name: "Umum", createdAt: new Date().toISOString() },
    ];
    return this.readFromStorage(storageKeys.categories, defaultCategories);
  };

  static setCategories = (categories: Category[]): void => {
    this.persistToStorage(storageKeys.categories, categories);
  };

  // Products
  static getProducts = (): Product[] => {
    return this.readFromStorage<Product[]>(storageKeys.products, []);
  };

  static setProducts = (products: Product[]): void => {
    this.persistToStorage(storageKeys.products, products);
  };

  // Transactions
  static getTransactions = (): Transaction[] => {
    return this.readFromStorage<Transaction[]>(storageKeys.transactions, []);
  };

  static setTransactions = (transactions: Transaction[]): void => {
    this.persistToStorage(storageKeys.transactions, transactions);
  };

  // Stock Logs
  static getStockLogs = (): StockLog[] => {
    return this.readFromStorage<StockLog[]>(storageKeys.stockLogs, []);
  };

  static setStockLogs = (stockLogs: StockLog[]): void => {
    this.persistToStorage(storageKeys.stockLogs, stockLogs);
  };
}