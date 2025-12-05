"use client";

import { useConfirm } from "@/components/ui/ConfirmModal";
import CategoryService from "@/services/CategoryService";
import ProductService from "@/services/ProductService";
import TransactionService from "@/services/TransactionService";
import { useAppState } from "@/hooks/useAppState";
import type { ModuleNavItem } from "@/app/types/dashboard";
import type { Transaction } from "@/types/pos";
import { currency, formatDateTime } from "@/utils/formatHelpers";
import { receiptService } from "@/services/receiptService";
import { useAPI } from "@/utils/config";

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

export function HomeContainer() {
  const { confirmModal } = useConfirm();
  const shouldUseAPI = useAPI();
  const {
    // Data
    categories,
    products,
    transactions,
    stockLogs,
    dashboardData,
    isLoading,
    error,

    // UI State
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
    setLocalCategories,
    setLocalProducts,
    setLocalTransactions,
    setLocalStockLogs,

    // API actions
    refetchCategories,
    refetchProducts,
  } = useAppState();

  // Category Actions
  const handleCreateCategory = async (name: string) => {
    await CategoryService.createCategory(name);
    if (!shouldUseAPI) {
      const updatedCategories = await CategoryService.getCategories();
      setLocalCategories(updatedCategories);
    } else {
      await refetchCategories();
    }
    resetCategoryForm();
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    await CategoryService.updateCategory(id, name);
    if (!shouldUseAPI) {
      const updatedCategories = await CategoryService.getCategories();
      setLocalCategories(updatedCategories);
    } else {
      await refetchCategories();
    }
    resetCategoryForm();
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    const confirmed = await confirmModal({
      title: 'Hapus Kategori',
      message: 'Apakah Anda yakin ingin menghapus kategori ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
      itemName: category?.name,
    });

    if (confirmed) {
      await CategoryService.deleteCategory(id);
      if (!shouldUseAPI) {
        const updatedCategories = await CategoryService.getCategories();
        setLocalCategories(updatedCategories);
      } else {
        await refetchCategories();
      }
    }
  };

  // Product Actions
  const handleCreateProduct = async () => {
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

    await ProductService.createProduct({
      name: productForm.name,
      price: priceValue,
      stock: stockValue,
      categoryId: productForm.categoryId,
      photo: productForm.photo,
    });

    if (!shouldUseAPI) {
      const updatedProducts = await ProductService.getProducts();
      setLocalProducts(updatedProducts);
    } else {
      await refetchProducts();
    }
    resetProductForm();
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;

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

    await ProductService.updateProduct(editingProductId, {
      name: productForm.name,
      price: priceValue,
      stock: stockValue,
      categoryId: productForm.categoryId,
      photo: productForm.photo,
    });

    if (!shouldUseAPI) {
      const updatedProducts = await ProductService.getProducts();
      setLocalProducts(updatedProducts);
    } else {
      await refetchProducts();
    }
    resetProductForm();
  };

  const handleDeleteProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    const confirmed = await confirmModal({
      title: 'Hapus Produk',
      message: 'Apakah Anda yakin ingin menghapus produk ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
      itemName: product?.name,
    });

    if (confirmed) {
      await ProductService.deleteProduct(id);
      if (!shouldUseAPI) {
        const updatedProducts = await ProductService.getProducts();
        setLocalProducts(updatedProducts);
      } else {
        await refetchProducts();
      }
    }
  };

  // Transaction Actions
  const handleAddToCart = async (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      triggerFlash("error", "Produk tidak ditemukan");
      return;
    }
    if (product.stock <= 0) {
      triggerFlash("info", "Stok produk kosong");
      return;
    }

    setCart((prev) => {
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
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
    setTransactionSearch("");
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeCartItem(productId);
      return;
    }

    const product = products.find((item) => item.id === productId);
    if (!product) {
      triggerFlash("error", "Produk tidak ditemukan");
      return;
    }

    if (qty > product.stock) {
      triggerFlash("info", "Stok tidak mencukupi");
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, qty } : item,
      )
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
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

    const transactionData = {
      items: cart,
      subtotal: cartSubtotal,
      total: cartSubtotal,
      paid: paidValue,
      change: paidValue - cartSubtotal,
    };

    try {
      const newTransaction = await TransactionService.createTransaction(transactionData);

      // Update local state if not using API
      if (!shouldUseAPI) {
        setLocalTransactions((prev) => [newTransaction, ...prev]);
        setLocalStockLogs((prev) => [
          ...cart.map((item) => ({
            id: Date.now().toString(),
            productId: item.productId,
            type: "out" as const,
            amount: item.qty,
            note: `Penjualan ${newTransaction.id}`,
            createdAt: newTransaction.createdAt,
          })),
          ...prev,
        ]);

        // Update product stock locally
        const updatedProducts = products.map((product) => {
          const cartItem = cart.find((item) => item.productId === product.id);
          if (!cartItem) return product;
          return { ...product, stock: Math.max(product.stock - cartItem.qty, 0) };
        });
        setLocalProducts(updatedProducts);
      }

      // Clear cart and form
      setCart([]);
      setCash("0");
      setTransactionSearch("");
      setSelectedTransactionId(newTransaction.id);
      setSummaryModal({ show: false, transaction: null });
    } catch (error) {
      // Error handling is done in TransactionService
    }
  };

  const confirmSaveTransaction = () => {
    if (!summaryModal.transaction) return;

    // Create preview transaction for modal
    const previewTransaction = summaryModal.transaction;

    // Actually save the transaction
    handleSaveTransaction();
  };

  const cancelSaveTransaction = () => {
    setSummaryModal({ show: false, transaction: null });
  };

  // Generate receipt
  const handleGenerateReceipt = (transaction: Transaction) => {
    receiptService.generateReceipt({
      transaction
    }).catch(error => {
      console.error('Failed to generate receipt:', error);
    });
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (transaction: Transaction) => {
    TransactionService.shareTransactionWhatsApp(transaction);
  };

  // Quick filter for reports
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

  // Helper functions
  const productNameById = (id: string) => products.find((item) => item.id === id)?.name ?? "-";
  const shortDate = (value: string) =>
    new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });

  // Calculate derived values for dashboard
  const topProduct = shouldUseAPI && dashboardData ? dashboardData.topProduct :
    transactions.reduce((best, trx) => {
      const soldMap = new Map<string, { name: string; qty: number }>();
      trx.items.forEach((item) => {
        const current = soldMap.get(item.productId);
        if (current) {
          current.qty += item.qty;
          soldMap.set(item.productId, current);
        } else {
          soldMap.set(item.productId, { name: item.name, qty: item.qty });
        }
      });

      let bestProduct: { name: string; qty: number } | null = null;
      for (const value of soldMap.values()) {
        if (!bestProduct || value.qty > bestProduct.qty) {
          bestProduct = value;
        }
      }
      return bestProduct?.name ?? "-";
    }, "-");

  const weeklyTrend = shouldUseAPI && dashboardData ? dashboardData.weeklyTrend :
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        label: i === 6 ? 'Hari Ini' : date.toLocaleDateString("id-ID", { weekday: "short" }),
        total: i === 6 ? todayRevenue : Math.floor(Math.random() * 50000), // Dummy data
      };
    });

  const maxWeeklyTotal = shouldUseAPI && dashboardData ? dashboardData.maxWeeklyTotal : 100000;

  // Prepare data for modules
  const omzetData = {
    todayTransactionsCount: shouldUseAPI && dashboardData ? dashboardData.todayTransactionsCount : todayTransactions.length,
    todayRevenue: shouldUseAPI && dashboardData ? dashboardData.todayRevenue : todayRevenue,
    topProduct,
    weeklyTrend,
    maxWeeklyTotal,
    latestTransactions: shouldUseAPI && dashboardData ? dashboardData.latestTransactions : latestTransactions,
    totalRevenue: shouldUseAPI && dashboardData ? dashboardData.totalRevenue : totalRevenue,
    averageOrder: shouldUseAPI && dashboardData ? dashboardData.averageOrder : averageOrder,
    totalTransactions: shouldUseAPI && dashboardData ? dashboardData.totalTransactions : transactions.length,
    currency,
    formatDateTime,
    isLoading,
    error,
  };

  const productsData = {
    categories,
    filteredProducts,
    productFilter,
    productSearch,
    productForm,
    editingProductId,
    categoryForm,
    editingCategoryId,
    isLoading,
    error,
    setProductFilter,
    setProductSearch,
    setProductForm,
    setCategoryForm,
    resetProductForm,
    resetCategoryForm,
    upsertProduct: editingProductId ? handleUpdateProduct : handleCreateProduct,
    handleEditProduct: (id: string) => {
      const product = products.find(p => p.id === id);
      if (product) {
        setProductForm({
          name: product.name,
          price: product.price.toString(),
          categoryId: product.categoryId,
          stock: product.stock.toString(),
          photo: product.photo || '',
        });
        setEditingProductId(id);
      }
    },
    handleDeleteProduct,
    upsertCategory: () => {
      const name = categoryForm.name.trim();
      if (!name) return;

      if (editingCategoryId) {
        handleUpdateCategory(editingCategoryId, name);
      } else {
        handleCreateCategory(name);
      }
    },
    handleEditCategory: (id: string) => {
      const category = categories.find(c => c.id === id);
      if (category) {
        setCategoryForm({ name: category.name });
        setEditingCategoryId(id);
      }
    },
    handleDeleteCategory,
    currency,
  };

  const transactionsData = {
    categories,
    transactionSearch,
    setTransactionSearch,
    matchingProducts,
    handleAddToCart,
    cart,
    products,
    updateCartQty,
    removeCartItem,
    cartSubtotal,
    cash,
    setCash,
    change,
    handleSaveTransaction: () => {
      if (!cart.length) {
        triggerFlash("info", "Keranjang kosong");
        return;
      }
      const paidValue = Number(cash);
      if (Number.isNaN(paidValue) || paidValue < cartSubtotal) {
        triggerFlash("error", "Tunai belum mencukupi");
        return;
      }

      const now = new Date().toISOString();
      const newTransaction = {
        id: `TRX-${now.replace(/\D/g, "").slice(-8)}`,
        createdAt: now,
        items: cart,
        subtotal: cartSubtotal,
        total: cartSubtotal,
        paid: paidValue,
        change: paidValue - cartSubtotal,
        hasReceipt: false,
        receiptGeneratedAt: null,
        receiptDownloadUrl: null,
      };

      setSummaryModal({ show: true, transaction: newTransaction });
    },
    stockLogs: stockLogs,
    productNameById,
    formatDateTime,
    selectedTransaction,
    handleGenerateReceipt,
    handleShareWhatsApp,
    currency,
    transactionCategoryFilter,
    setTransactionCategoryFilter,
  };

  const reportsData = {
    filteredTransactions,
    dateRange,
    setDateRange,
    quickFilter,
    shortDate,
    currency,
    setSelectedTransactionId,
  };

  const activeNav = moduleNavItems.find((item) => item.key === activeModule);

  return {
    // Navigation
    moduleNavItems,
    activeModule,
    setActiveModule,
    activeNav,

    // UI State
    flash,
    isLoading,

    // Module data
    omzetData,
    productsData,
    transactionsData,
    reportsData,

    // Modal state
    summaryModal,
    confirmSaveTransaction,
    cancelSaveTransaction,
  };
}