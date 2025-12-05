import { useState, useEffect, useMemo, useCallback } from "react";
import type { Category, Product, Transaction, StockLog, FlashMessage, TransactionItem } from "@/types/pos";
import type { ModuleKey } from "@/app/types/dashboard";
import { StorageService, generateId } from "@/services/StorageService";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useStockLogs } from "@/hooks/useStockLogs";
import { useTransactions } from "@/hooks/useTransactions";
import { useAPI } from "@/utils/config";

export interface CategoryForm {
  name: string;
}

export interface ProductForm {
  name: string;
  price: string;
  categoryId: string;
  stock: string;
  photo: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SummaryModal {
  show: boolean;
  transaction: Transaction | null;
}

export interface AppState {
  // Data
  categories: Category[];
  products: Product[];
  transactions: Transaction[];
  stockLogs: StockLog[];

  // UI State
  isReady: boolean;
  activeModule: ModuleKey;
  flash: FlashMessage | null;

  // Forms
  categoryForm: CategoryForm;
  editingCategoryId: string | null;
  productForm: ProductForm;
  editingProductId: string | null;

  // Filters
  productFilter: string;
  productSearch: string;
  transactionSearch: string;
  transactionCategoryFilter: string;
  dateRange: DateRange;

  // Transaction state
  cart: TransactionItem[];
  cash: string;
  selectedTransactionId: string | null;

  // Modal state
  summaryModal: SummaryModal;
}

export const useAppState = () => {
  // API Configuration
  const shouldUseAPI = useAPI();

  // API Hooks
  const {
    categories: apiCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  const {
    products: apiProducts,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts();

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardData();
  const { data: apiStockLogs, isLoading: stockLogsLoading, error: stockLogsError } = useStockLogs();
  
  // Import and use transactions hook
  const { data: apiTransactions, isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useTransactions();

  // Local State
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [localStockLogs, setLocalStockLogs] = useState<StockLog[]>([]);
  const [isReady, setIsReady] = useState(false);

  // UI State
  const [activeModule, setActiveModule] = useState<ModuleKey>("omzet");
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  // Form State
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    price: "",
    categoryId: "",
    stock: "",
    photo: "",
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Filter State
  const [productFilter, setProductFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });

  // Transaction State
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [cash, setCash] = useState("0");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Modal State
  const [summaryModal, setSummaryModal] = useState<SummaryModal>({ show: false, transaction: null });

  // Determine which data source to use
  const currentCategories = shouldUseAPI ? apiCategories : localCategories;
  const currentProducts = shouldUseAPI ? apiProducts : localProducts;
  const currentTransactions = shouldUseAPI ? apiTransactions : localTransactions;

  // Initialize local data
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!shouldUseAPI) {
      const defaultCategories: Category[] = [
        { id: generateId(), name: "Umum", createdAt: new Date().toISOString() },
      ];

      setLocalCategories(StorageService.getCategories());
      setLocalProducts(StorageService.getProducts());
      setLocalTransactions(StorageService.getTransactions());
      setLocalStockLogs(StorageService.getStockLogs());
    }

    setIsReady(true);
  }, [shouldUseAPI]);

  // Persist local data
  useEffect(() => {
    if (!isReady || shouldUseAPI) return;
    StorageService.setCategories(localCategories);
  }, [localCategories, isReady, shouldUseAPI]);

  useEffect(() => {
    if (!isReady || shouldUseAPI) return;
    StorageService.setProducts(localProducts);
  }, [localProducts, isReady, shouldUseAPI]);

  useEffect(() => {
    if (!isReady || shouldUseAPI) return;
    StorageService.setTransactions(localTransactions);
  }, [localTransactions, isReady, shouldUseAPI]);

  useEffect(() => {
    if (!isReady || shouldUseAPI) return;
    StorageService.setStockLogs(localStockLogs);
  }, [localStockLogs, isReady, shouldUseAPI]);

  // Auto-set default category for product form
  useEffect(() => {
    if (!currentCategories.length) return;
    setProductForm((prev) => {
      if (prev.categoryId) return prev;
      return { ...prev, categoryId: currentCategories[0].id };
    });
  }, [currentCategories]);

  // Flash message auto-clear
  useEffect(() => {
    if (!flash) return;
    const timeout = window.setTimeout(() => setFlash(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  // Memoized calculations
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(currentProducts)) return [];

    return currentProducts.filter((product) => {
      const productCategoryId = product.categoryId || "";
      const matchCategory = productFilter === "all" || productCategoryId === productFilter;
      const matchSearch = productSearch === "" || product.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [currentProducts, productFilter, productSearch]);

  const matchingProducts = useMemo(() => {
    if (!Array.isArray(currentProducts)) return [];

    return currentProducts
      .filter((product) => {
        const productCategoryId = product.categoryId || "";
        const matchName = transactionSearch === "" || product.name.toLowerCase().includes(transactionSearch.toLowerCase());
        const matchCategory =
          transactionCategoryFilter === "all" ||
          productCategoryId === transactionCategoryFilter;
        return matchName && matchCategory;
      })
      .slice(0, 6);
  }, [currentProducts, transactionSearch, transactionCategoryFilter]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  );

  const change = Number(cash || "0") - cartSubtotal;

  const todayTransactions = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return currentTransactions.filter((trx: Transaction) => new Date(trx.createdAt) >= startOfDay);
  }, [currentTransactions, shouldUseAPI]);

  const todayRevenue = useMemo(() => {
    return todayTransactions.reduce((sum: number, trx: Transaction) => sum + trx.total, 0);
  }, [todayTransactions]);

  const filteredTransactions = useMemo(() => {
    return currentTransactions.filter((trx: Transaction) => {
      if (!dateRange.start && !dateRange.end) return true;
      const trxDate = new Date(trx.createdAt).setHours(0, 0, 0, 0);
      const startDate = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : -Infinity;
      const endDate = dateRange.end ? new Date(dateRange.end).setHours(0, 0, 0, 0) : Infinity;
      return trxDate >= startDate && trxDate <= endDate;
    });
  }, [currentTransactions, dateRange, shouldUseAPI]);

  const selectedTransaction = useMemo(
    () => currentTransactions.find((trx: Transaction) => trx.id === selectedTransactionId) ?? null,
    [currentTransactions, selectedTransactionId, shouldUseAPI],
  );

  const latestTransactions = useMemo(() => currentTransactions.slice(0, 5), [currentTransactions, shouldUseAPI]);

  const totalRevenue = useMemo(() => currentTransactions.reduce((sum: number, trx: Transaction) => sum + trx.total, 0), [currentTransactions, shouldUseAPI]);

  const averageOrder = useMemo(() => {
    return currentTransactions.length ? totalRevenue / currentTransactions.length : 0;
  }, [currentTransactions, totalRevenue, shouldUseAPI]);

  // Actions
  const triggerFlash = useCallback((type: FlashMessage["type"], text: string) => {
    setFlash({ type, text });
  }, []);

  const resetProductForm = useCallback(() => {
    setProductForm({
      name: "",
      price: "",
      categoryId: currentCategories[0]?.id ?? "",
      stock: "",
      photo: "",
    });
    setEditingProductId(null);
  }, [currentCategories]);

  const resetCategoryForm = useCallback(() => {
    setCategoryForm({ name: "" });
    setEditingCategoryId(null);
  }, []);

  // Local state setters
  const setLocalCategoriesState = useCallback((categories: Category[] | ((prev: Category[]) => Category[])) => {
    if (shouldUseAPI) return;
    setLocalCategories(categories);
  }, [shouldUseAPI]);

  const setLocalProductsState = useCallback((products: Product[] | ((prev: Product[]) => Product[])) => {
    if (shouldUseAPI) return;
    setLocalProducts(products);
  }, [shouldUseAPI]);

  const setLocalTransactionsState = useCallback((transactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    if (shouldUseAPI) return;
    setLocalTransactions(transactions);
  }, [shouldUseAPI]);

  const setLocalStockLogsState = useCallback((stockLogs: StockLog[] | ((prev: StockLog[]) => StockLog[])) => {
    if (shouldUseAPI) return;
    setLocalStockLogs(stockLogs);
  }, [shouldUseAPI]);

  // Return app state and actions
  return {
    // Data
    categories: currentCategories,
    products: currentProducts,
    transactions: currentTransactions,
    stockLogs: shouldUseAPI ? apiStockLogs : localStockLogs,

    // Dashboard data
    dashboardData,
    isLoading: dashboardLoading || categoriesLoading || productsLoading || stockLogsLoading || transactionsLoading,
    error: dashboardError || categoriesError || productsError || stockLogsError || transactionsError,

    // UI State
    isReady,
    activeModule,
    setActiveModule,
    flash,
    triggerFlash,

    // Forms
    categoryForm,
    setCategoryForm,
    editingCategoryId,
    setEditingCategoryId,
    productForm,
    setProductForm,
    editingProductId,
    setEditingProductId,
    resetProductForm,
    resetCategoryForm,

    // Filters
    productFilter,
    setProductFilter,
    productSearch,
    setProductSearch,
    transactionSearch,
    setTransactionSearch,
    transactionCategoryFilter,
    setTransactionCategoryFilter,
    dateRange,
    setDateRange,

    // Transaction state
    cart,
    setCart,
    cash,
    setCash,
    cartSubtotal,
    change,
    selectedTransactionId,
    setSelectedTransactionId,

    // Modal state
    summaryModal,
    setSummaryModal,

    // Calculated values
    filteredProducts,
    matchingProducts,
    todayTransactions,
    todayRevenue,
    filteredTransactions,
    selectedTransaction,
    latestTransactions,
    totalRevenue,
    averageOrder,

    // Local state setters
    setLocalCategories: setLocalCategoriesState,
    setLocalProducts: setLocalProductsState,
    setLocalTransactions: setLocalTransactionsState,
    setLocalStockLogs: setLocalStockLogsState,

    // API actions
    refetchCategories,
    refetchProducts,
    refetchTransactions,
  };
};