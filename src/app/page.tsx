"use client";

import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { OmzetModule } from "@/components/dashboard/OmzetModule";
import { ProductsModule } from "@/components/dashboard/ProductsModule";
import { TransactionsModule } from "@/components/dashboard/TransactionsModule";
import { ReportsModule } from "@/components/dashboard/ReportsModule";
import type { ModuleKey, ModuleNavItem } from "./types/dashboard";
import type {
  Category,
  FlashMessage,
  Product,
  StockLog,
  Transaction,
  TransactionItem,
} from "@/types/pos";
import { jsPDF } from "jspdf";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createTransaction, fetchStockLogs, fetchTransactions } from "@/lib/transactions";
import { fetchDashboardSummary, setDashboardRefreshCallback } from "@/lib/dashboard";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/categories";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/lib/products";
const storageKeys = {
  categories: "poslynk-categories",
  products: "poslynk-products",
  transactions: "poslynk-transactions",
  stockLogs: "poslynk-stock-logs",
};

const moduleNavItems: ModuleNavItem[] = [
  {
    key: "omzet",
    label: "Omzet",
    description: "Ringkasan pendapatan & grafik mini",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 19h16" />
        <path d="M4 13l4-4 4 3 6-7" />
        <circle cx="8" cy="9" r="0" />
      </svg>
    ),
  },
  {
    key: "produk",
    label: "Barang",
    description: "Katalog produk & kategori",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: "transaksi",
    label: "Transaksi",
    description: "Kasir realtime + stok otomatis",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h2" />
      </svg>
    ),
  },
  {
    key: "laporan",
    label: "Laporan",
    description: "Riwayat transaksi lengkap",
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 3h7l5 5v13a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M15 3v5h5" />
        <path d="M10 13h6" />
        <path d="M10 17h4" />
      </svg>
    ),
  },
];

const currency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const storeName = "Sentosa POS";

const readFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error("Failed to read storage", error);
    return fallback;
  }
};

const persistToStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to write storage", error);
  }
};
export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [isReady, setIsReady] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    categoryId: "",
    stock: "",
    photo: "",
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");

  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [cash, setCash] = useState("0");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState("all");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleKey>("omzet");
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<{
    todayTransactionsCount: number;
    todayRevenue: number;
    topProduct: string | null;
    weeklyTrend: Array<{ label: string; total: number }>;
    maxWeeklyTotal: number;
    totalRevenue: number;
    averageOrder: number;
    totalTransactions: number;
  } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const defaultCategories: Category[] = [
      { id: generateId(), name: "Umum", createdAt: new Date().toISOString() },
    ];
    setCategories(readFromStorage<Category[]>(storageKeys.categories, defaultCategories));
    setProducts(readFromStorage<Product[]>(storageKeys.products, []));
    setTransactions(readFromStorage<Transaction[]>(storageKeys.transactions, []));
    setStockLogs(readFromStorage<StockLog[]>(storageKeys.stockLogs, []));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    persistToStorage(storageKeys.categories, categories);
  }, [categories, isReady]);

  useEffect(() => {
    if (!isReady) return;
    persistToStorage(storageKeys.products, products);
  }, [products, isReady]);

  useEffect(() => {
    if (!isReady) return;
    persistToStorage(storageKeys.transactions, transactions);
  }, [transactions, isReady]);

  useEffect(() => {
    if (!isReady) return;
    persistToStorage(storageKeys.stockLogs, stockLogs);
  }, [stockLogs, isReady]);

  useEffect(() => {
    if (!Array.isArray(categories) || categories.length === 0) return;
    setProductForm((prev) => {
      if (prev.categoryId) return prev;
      return { ...prev, categoryId: categories[0].id };
    });
  }, [categories]);

  useEffect(() => {
    if (!flash) return;
    const timeout = window.setTimeout(() => setFlash(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [flash]);
  const triggerFlash = useCallback((type: FlashMessage["type"], text: string) => {
    setFlash({ type, text });
  }, []);

  const refreshTransactionsFromApi = useCallback(async () => {
    try {
      const remoteTransactions = await fetchTransactions();
      setTransactions(remoteTransactions);
    } catch (error) {
      console.error("Failed to load transactions", error);
      triggerFlash("error", "Gagal memuat data transaksi");
    }
  }, [triggerFlash]);

  const refreshStockLogsFromApi = useCallback(async () => {
    try {
      const logs = await fetchStockLogs();
      setStockLogs(logs);
    } catch (error) {
      console.error("Failed to load stock logs", error);
    }
  }, []);

  useEffect(() => {
    refreshTransactionsFromApi();
    refreshStockLogsFromApi();
  }, [refreshTransactionsFromApi, refreshStockLogsFromApi]);

  const refreshDashboardSummary = useCallback(async () => {
    try {
      const summary = await fetchDashboardSummary();
      setDashboardSummary(summary);
    } catch (error) {
      console.error("Failed to load dashboard summary", error);
    }
  }, []);

  const refreshCategoriesFromApi = useCallback(async () => {
    try {
      const remoteCategories = await fetchCategories();
      setCategories(remoteCategories);
    } catch (error) {
      console.error("Failed to load categories", error);
      triggerFlash("error", "Gagal memuat data kategori");
    }
  }, [triggerFlash]);

  // Refresh categories without triggerFlash dependency (to avoid infinite loops)
  const refreshCategoriesFromApiSilently = useCallback(async () => {
    try {
      console.log('refreshCategoriesFromApiSilently called');
      const remoteCategories = await fetchCategories();
      console.log('Categories received from API:', remoteCategories);
      
      // Hanya set jika data valid dan berbeda
      if (Array.isArray(remoteCategories) && remoteCategories.length > 0) {
        console.log('Setting valid categories to state:', remoteCategories);
        setCategories(remoteCategories);
      } else {
        console.log('Invalid or empty categories, keeping current state');
      }
      
      // Log state after setCategories (delayed)
      setTimeout(() => {
        console.log('Categories state after setTimeout check');
      }, 100);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  }, []);

  const refreshProductsFromApi = useCallback(async () => {
    try {
      const remoteProducts = await fetchProducts();
      setProducts(remoteProducts);
    } catch (error) {
      console.error("Failed to load products", error);
      triggerFlash("error", "Gagal memuat data produk");
    }
  }, [triggerFlash]);

  // Refresh products without triggerFlash dependency (to avoid infinite loops)
  const refreshProductsFromApiSilently = useCallback(async () => {
    try {
      const remoteProducts = await fetchProducts();
      setProducts(remoteProducts);
    } catch (error) {
      console.error("Failed to load products", error);
    }
  }, []);

  // Register the callback for external triggers
  useEffect(() => {
    setDashboardRefreshCallback(() => refreshDashboardSummary);
  }, [refreshDashboardSummary]);

  // Load dashboard summary on mount
  useEffect(() => {
    refreshDashboardSummary();
    refreshCategoriesFromApi();
    refreshProductsFromApi();
  }, [refreshDashboardSummary, refreshCategoriesFromApi, refreshProductsFromApi]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((product) => {
      const matchCategory = productFilter === "all" || product.categoryId === productFilter;
      const matchSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, productFilter, productSearch]);

  const matchingProducts = useMemo(() => {
    if (!transactionSearch.trim()) return [];
    return products
      .filter((product) => {
        const matchName = product.name.toLowerCase().includes(transactionSearch.toLowerCase());
        const matchCategory =
          transactionCategoryFilter === "all" || product.categoryId === transactionCategoryFilter;
        return matchName && matchCategory;
      })
      .slice(0, 6);
  }, [products, transactionSearch, transactionCategoryFilter]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  );

  const change = Number(cash || "0") - cartSubtotal;

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayTransactions = transactions.filter((trx) => new Date(trx.createdAt) >= startOfDay);
  const todayRevenue = todayTransactions.reduce((sum, trx) => sum + trx.total, 0);

  const topProduct = useMemo(() => {
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
  }, [transactions]);

  const weeklyTrend = useMemo(() => {
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
      trend.push({ label: start.toLocaleDateString("id-ID", { weekday: "short" }), total });
    }
    return trend;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      if (!dateRange.start && !dateRange.end) return true;
      const trxDate = new Date(trx.createdAt).setHours(0, 0, 0, 0);
      const startDate = dateRange.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : -Infinity;
      const endDate = dateRange.end ? new Date(dateRange.end).setHours(0, 0, 0, 0) : Infinity;
      return trxDate >= startDate && trxDate <= endDate;
    });
  }, [transactions, dateRange]);

  const selectedTransaction = useMemo(
    () => transactions.find((trx) => trx.id === selectedTransactionId) ?? null,
    [transactions, selectedTransactionId],
  );

  const latestTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
  const totalRevenue = useMemo(() => transactions.reduce((sum, trx) => sum + trx.total, 0), [transactions]);
  const averageOrder = transactions.length ? totalRevenue / transactions.length : 0;
  const maxWeeklyTotal = Math.max(1, ...weeklyTrend.map((point) => point.total));
  const resetProductForm = () => {
    setProductForm({ name: "", price: "", categoryId: categories[0]?.id ?? "", stock: "", photo: "" });
    setEditingProductId(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "" });
    setEditingCategoryId(null);
  };

  const upsertCategory = async () => {
    if (!categoryForm.name.trim()) {
      triggerFlash("error", "Nama kategori wajib diisi");
      return;
    }
    try {
      if (editingCategoryId) {
        const updatedCategory = await updateCategory(editingCategoryId, categoryForm.name.trim());
        setCategories((prev) =>
          prev.map((category) =>
            category.id === editingCategoryId ? updatedCategory : category,
          ),
        );
        // Refresh categories from API to ensure dropdown is updated
        await refreshCategoriesFromApiSilently();
        triggerFlash("success", "Kategori diperbarui");
      } else {
        const exists = Array.isArray(categories) && categories.some(
          (category) => category.name.toLowerCase() === categoryForm.name.toLowerCase(),
        );
        if (exists) {
          triggerFlash("info", "Kategori sudah tersedia");
          return;
        }

        // Coba simpan dan tangani error duplikasi
        try {
          const newCategory = await createCategory(categoryForm.name.trim());
          // Refresh categories from API to ensure dropdown is updated
          await refreshCategoriesFromApiSilently();
          triggerFlash("success", "Kategori ditambahkan");
        } catch (error) {
          // Check apakah ini error duplikasi nama
          if (error instanceof Error && error.message.toLowerCase().includes('already') || 
              error.message.toLowerCase().includes('exists') ||
              error.message.toLowerCase().includes('taken')) {
            triggerFlash("info", "Nama kategori sudah digunakan");
          } else {
            console.error("Failed to create category", error);
            triggerFlash(
              "error",
              error instanceof Error ? error.message : "Gagal menyimpan kategori",
            );
          }
        }
        // const newCategory = await createCategory(categoryForm.name.trim());
        // setCategories((prev) => Array.isArray(prev) ? [...prev, newCategory] : [newCategory]);
        // triggerFlash("success", "Kategori ditambahkan");
      }
      resetCategoryForm();
    } catch (error) {
      console.error("Failed to save category", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      triggerFlash(
        "error",
        error instanceof Error ? error.message : "Gagal menyimpan kategori",
      );
    }
  };

  const handleEditCategory = (id: string) => {
    const category = Array.isArray(categories) ? categories.find((item) => item.id === id) : null;
    if (!category) return;
    setCategoryForm({ name: category.name });
    setEditingCategoryId(category.id);
  };

  const handleDeleteCategory = async (id: string) => {
    const used = Array.isArray(products) && products.some((product) => product.categoryId === id);
    if (used) {
      triggerFlash("error", "Kategori digunakan produk");
      return;
    }
    if (!Array.isArray(categories) || categories.length <= 1) {
      triggerFlash("info", "Minimal satu kategori aktif");
      return;
    }
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      triggerFlash("info", "Kategori dihapus");
      if (editingCategoryId === id) resetCategoryForm();
    } catch (error) {
      console.error("Failed to delete category", error);
      triggerFlash(
        "error",
        error instanceof Error ? error.message : "Gagal menghapus kategori",
      );
    }
  };

  const upsertProduct = async () => {
    if (!productForm.name.trim()) {
      triggerFlash("error", "Nama produk wajib diisi");
      return;
    }
    const priceValue = Number(productForm.price);
    const stockValue = Number(productForm.stock || "0");
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      triggerFlash("error", "Harga tidak valid");
      return;
    }
    if (stockValue < 0) {
      triggerFlash("error", "Stok tidak boleh negatif");
      return;
    }
    if (!productForm.categoryId) {
      triggerFlash("error", "Pilih kategori");
      return;
    }
    try {
      if (editingProductId) {
        const updatedProduct = await updateProduct(editingProductId, {
          name: productForm.name.trim(),
          price: priceValue,
          stock: stockValue,
          categoryId: productForm.categoryId,
          photo: productForm.photo.trim(),
        });
        // Refresh products from API to ensure filter is updated
        await refreshProductsFromApiSilently();
        triggerFlash("success", "Produk diperbarui");
      } else {
        const newProduct = await createProduct({
          name: productForm.name.trim(),
          price: priceValue,
          stock: stockValue,
          categoryId: productForm.categoryId,
          photo: productForm.photo.trim(),
        });
        // Refresh products from API to ensure filter is updated
        await refreshProductsFromApiSilently();
        triggerFlash("success", "Produk ditambahkan");
      }
      resetProductForm();
    } catch (error) {
      console.error("Failed to save product", error);
      triggerFlash(
        "error",
        error instanceof Error ? error.message : "Gagal menyimpan produk",
      );
    }
  };

  const handleEditProduct = (id: string) => {
    const product = Array.isArray(products) ? products.find((item) => item.id === id) : null;
    if (!product) return;
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      price: String(product.price),
      categoryId: product.categoryId,
      stock: String(product.stock),
      photo: product.photo ?? "",
    });
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      // Refresh products from API to ensure filter is updated
      await refreshProductsFromApiSilently();
      setCart((prev) => prev.filter((item) => item.productId !== id));
      triggerFlash("info", "Produk dihapus");
      if (editingProductId === id) resetProductForm();
    } catch (error) {
      console.error("Failed to delete product", error);
      triggerFlash(
        "error",
        error instanceof Error ? error.message : "Gagal menghapus produk",
      );
    }
  };
  const handleAddToCart = (productId: string) => {
    const product = Array.isArray(products) ? products.find((item) => item.id === productId) : null;
    if (!product) {
      triggerFlash("error", "Produk tidak ditemukan");
      return;
    }
    if (product.stock <= 0) {
      triggerFlash("info", "Stok produk kosong");
      return;
    }
    setCart((prev) => {
      if (!Array.isArray(prev)) return [{ productId: product.id, name: product.name, price: product.price, qty: 1 }];
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          triggerFlash("info", "Stok tidak mencukupi");
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return Array.isArray(prev) ? [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }] : [{ productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
    setTransactionSearch("");
  };

  const updateCartQty = (productId: string, qty: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (Number.isNaN(qty)) return;
    const normalized = Math.floor(qty);
    if (normalized <= 0) {
      setCart((prev) => Array.isArray(prev) ? prev.filter((item) => item.productId !== productId) : []);
      return;
    }
    if (normalized > product.stock) {
      triggerFlash("info", "Qty melebihi stok");
      return;
    }
    setCart((prev) =>
      Array.isArray(prev) ? prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              qty: normalized,
            }
          : item,
      ) : []
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => Array.isArray(prev) ? prev.filter((item) => item.productId !== productId) : []);
  };
  const handleSaveTransaction = async () => {
    if (!cart.length) {
      triggerFlash("info", "Keranjang kosong");
      return;
    }
    const paidValue = Number(cash);
    if (Number.isNaN(paidValue) || paidValue < cartSubtotal) {
      triggerFlash("error", "Tunai belum mencukupi");
      return;
    }
    setIsSavingTransaction(true);
    try {
      const savedTransaction = await createTransaction({
        items: cart.map((item) => ({ product_id: item.productId, qty: item.qty })),
        paid: paidValue,
      });

      setTransactions((prev) => Array.isArray(prev) ? [savedTransaction, ...prev] : [savedTransaction]);
      setProducts((prev) =>
        prev.map((product) => {
          const cartItem = cart.find((item) => item.productId === product.id);
          if (!cartItem) return product;
          return { ...product, stock: Math.max(product.stock - cartItem.qty, 0) };
        }),
      );
      await refreshStockLogsFromApi();
      await refreshDashboardSummary();
      await refreshProductsFromApi();
      await refreshCategoriesFromApi();
      setCart([]);
      setCash("0");
      setTransactionSearch("");
      setSelectedTransactionId(savedTransaction.id);
      triggerFlash("success", "Transaksi tersimpan");
      handleGenerateReceipt(savedTransaction);
    } catch (error) {
      console.error("Failed to save transaction", error);
      triggerFlash(
        "error",
        error instanceof Error ? error.message : "Gagal menyimpan transaksi",
      );
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const handleGenerateReceipt = (transaction: Transaction) => {
    const doc = new jsPDF();
    let cursorY = 15;
    doc.setFontSize(14);
    doc.text(storeName, 10, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    doc.text(`Tanggal : ${formatDateTime(transaction.createdAt)}`, 10, cursorY);
    cursorY += 5;
    doc.text(`ID Transaksi : ${transaction.id}`, 10, cursorY);
    cursorY += 8;

    transaction.items.forEach((item) => {
      doc.text(`${item.name} x${item.qty}`, 10, cursorY);
      doc.text(currency(item.price * item.qty), 200, cursorY, { align: "right" });
      cursorY += 6;
    });

    cursorY += 2;
    doc.line(10, cursorY, 200, cursorY);
    cursorY += 6;
    doc.text(`Subtotal: ${currency(transaction.subtotal)}`, 10, cursorY);
    cursorY += 5;
    doc.text(`Total: ${currency(transaction.total)}`, 10, cursorY);
    cursorY += 5;
    doc.text(`Tunai: ${currency(transaction.paid)}`, 10, cursorY);
    cursorY += 5;
    doc.text(`Kembalian: ${currency(transaction.change)}`, 10, cursorY);

    cursorY += 10;
    doc.setFontSize(9);
    doc.text("Terima kasih sudah berbelanja!", 10, cursorY);
    doc.save(`struk-${transaction.id}.pdf`);
  };

  const handleShareWhatsApp = (transaction: Transaction) => {
    const lines = [
      `Struk ${storeName}`,
      `ID: ${transaction.id}`,
      `Tanggal: ${formatDateTime(transaction.createdAt)}`,
      "",
    ];
    transaction.items.forEach((item) =>
      lines.push(`${item.name} x${item.qty} = ${currency(item.price * item.qty)}`),
    );
    lines.push("", `Total: ${currency(transaction.total)}`, `Tunai: ${currency(transaction.paid)}`);
    lines.push(`Kembalian: ${currency(transaction.change)}`);
    const url = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank");
  };
  const quickFilter = (type: "today" | "week" | "month" | "all") => {
    const now = new Date();
    if (type === "all") {
      setDateRange({ start: "", end: "" });
      return;
    }
    if (type === "today") {
      const date = now.toISOString().split("T")[0];
      setDateRange({ start: date, end: date });
      return;
    }
    if (type === "week") {
      const end = now.toISOString().split("T")[0];
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      setDateRange({ start: startDate.toISOString().split("T")[0], end });
      return;
    }
    if (type === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      setDateRange({ start, end });
    }
  };

  const productNameById = (id: string) => Array.isArray(products) ? products.find((item) => item.id === id)?.name ?? "-" : "-";
  const activeNav = moduleNavItems.find((item) => item.key === activeModule);

  return (
    <div className="min-h-screen py-12 text-[var(--foreground)] px-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 lg:flex-row lg:px-8">
        <SidebarNav
          storeName={storeName}
          summaryText="Kelola transaksi, produk, laporan, dan omzet dari satu layar."
          totalRevenueFormatted={currency(totalRevenue)}
          items={moduleNavItems}
          activeModule={activeModule}
          onSelect={setActiveModule}
        />
        <main className="flex-1 space-y-8">
          <header className="rounded-3xl border border-[var(--card-border)] bg-white/80 px-8 py-6 shadow-sm shadow-[#5e8c520f]">
            <p className="text-base font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">Modul aktif</p>
            <h2 className="mt-2 text-5xl font-bold text-[var(--foreground)]">{activeNav?.label ?? "Omzet"}</h2>
            <p className="text-lg text-[var(--text-muted)]">{activeNav?.description}</p>
          </header>

          {flash && (
            <div
              className={`rounded-2xl border px-8 py-6 text-lg shadow-sm transition ${
                flash.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : flash.type === "success"
                    ? "border-[#5e8c5233] bg-[#a1b98633] text-[#2f4a28]"
                    : "border-[#a1b98633] bg-white/70 text-[var(--text-muted)]"
              }`}
            >
              {flash.text}
            </div>
          )}

          {activeModule === "omzet" && (
            <OmzetModule
              todayTransactionsCount={dashboardSummary?.todayTransactionsCount ?? todayTransactions.length}
              todayRevenue={dashboardSummary?.todayRevenue ?? todayRevenue}
              topProduct={dashboardSummary?.topProduct ?? topProduct}
              weeklyTrend={dashboardSummary?.weeklyTrend ?? weeklyTrend}
              maxWeeklyTotal={dashboardSummary?.maxWeeklyTotal ?? maxWeeklyTotal}
              latestTransactions={dashboardSummary?.latestTransactions ?? latestTransactions}
              totalRevenue={dashboardSummary?.totalRevenue ?? totalRevenue}
              averageOrder={dashboardSummary?.averageOrder ?? averageOrder}
              totalTransactions={dashboardSummary?.totalTransactions ?? transactions.length}
              currency={currency}
              formatDateTime={formatDateTime}
            />
          )}

          {activeModule === "produk" && (
            <ProductsModule
              categories={(() => {
                console.log('Passing categories to ProductsModule:', categories);
                return Array.isArray(categories) ? categories : [];
              })()}
              filteredProducts={Array.isArray(filteredProducts) ? filteredProducts : []}
              productFilter={productFilter}
              productSearch={productSearch}
              productForm={productForm}
              editingProductId={editingProductId}
              categoryForm={categoryForm}
              editingCategoryId={editingCategoryId}
              setProductFilter={setProductFilter}
              setProductSearch={setProductSearch}
              setProductForm={setProductForm}
              setCategoryForm={setCategoryForm}
              resetProductForm={resetProductForm}
              resetCategoryForm={resetCategoryForm}
              upsertProduct={upsertProduct}
              handleEditProduct={handleEditProduct}
              handleDeleteProduct={handleDeleteProduct}
              upsertCategory={upsertCategory}
              handleEditCategory={handleEditCategory}
              handleDeleteCategory={handleDeleteCategory}
              currency={currency}
            />
          )}

          {activeModule === "transaksi" && (
            <TransactionsModule
              categories={categories}
              transactionSearch={transactionSearch}
              setTransactionSearch={setTransactionSearch}
              matchingProducts={matchingProducts}
              handleAddToCart={handleAddToCart}
              cart={cart}
              products={products}
              updateCartQty={updateCartQty}
              removeCartItem={removeCartItem}
              cartSubtotal={cartSubtotal}
              cash={cash}
              setCash={setCash}
              change={change}
              handleSaveTransaction={handleSaveTransaction}
              isSavingTransaction={isSavingTransaction}
              stockLogs={stockLogs}
              productNameById={productNameById}
              formatDateTime={formatDateTime}
              selectedTransaction={selectedTransaction}
              handleGenerateReceipt={handleGenerateReceipt}
              handleShareWhatsApp={handleShareWhatsApp}
              currency={currency}
              transactionCategoryFilter={transactionCategoryFilter}
              setTransactionCategoryFilter={setTransactionCategoryFilter}
            />
          )}

          {activeModule === "laporan" && (
            <ReportsModule
              filteredTransactions={filteredTransactions}
              dateRange={dateRange}
              setDateRange={setDateRange}
              quickFilter={quickFilter}
              shortDate={shortDate}
              currency={currency}
              setSelectedTransactionId={setSelectedTransactionId}
            />
          )}
        </main>
      </div>
    </div>
  );
}



