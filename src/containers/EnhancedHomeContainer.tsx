"use client";

import { useState, useEffect } from "react";
import { useConfirm } from "@/components/ui/ConfirmModal";
import CategoryService from "@/services/CategoryService";
import ProductService from "@/services/ProductService";
import TransactionService from "@/services/TransactionService";
import { useAppState } from "@/hooks/useAppState";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import { useCart } from "@/hooks/useCart";
import { useModuleNavigation } from "@/hooks/useModuleNavigation";
import { useLoadingStates } from "@/hooks/useLoadingStates";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DataTransformationUtils } from "@/utils/dataTransformations";
import { currency, formatDateTime } from "@/utils/formatHelpers";
import { receiptService } from "@/services/receiptService";
import { useAPI } from "@/utils/config";
import { STORE_INFO } from "@/config/receiptConfig";
import type { Transaction, TransactionItem, Product, Category, StockLog } from "@/types/pos";

export function EnhancedHomeContainer() {
  const { confirmModal } = useConfirm();
  const shouldUseAPI = useAPI();
  const { success, error, info } = useFlashMessage();
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart,
    getItemQuantity,
    cartSubtotal,
  } = useCart();
  const { activeModule, setActiveModule, moduleNavItems, getActiveModule } = useModuleNavigation();
  const { withLoading, isLoading } = useLoadingStates();

  // Use localStorage for local state
  const [localTransactions, setLocalTransactions] = useLocalStorage<Transaction[]>('pos-transactions', []);
  const [localCategories, setLocalCategories] = useLocalStorage<Category[]>('pos-categories', [
    { id: '1', name: 'Umum', createdAt: new Date().toISOString() }
  ]);
  const [localStockLogs, setLocalStockLogs] = useLocalStorage<StockLog[]>('pos-stock-logs', []);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // App State
  const {
    categories,
    products,
    stockLogs,
    dashboardData,
    error: appError,
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
    cash,
    setCash,
    selectedTransactionId,
    setSelectedTransactionId,
    // Modal state
    summaryModal,
    setSummaryModal,
    // API actions
    refetchCategories,
    refetchProducts,
  } = useAppState();

  const activeNav = getActiveModule();

  // Fetch transaction details when selectedTransactionId changes (API mode only)
  useEffect(() => {
    if (selectedTransactionId && shouldUseAPI) {
      const fetchTransactionDetails = async () => {
        try {
          const transaction = await TransactionService.getTransactionById(selectedTransactionId);
          setSelectedTransaction(transaction || null);
        } catch (error) {
          console.error('Error fetching transaction details:', error);
          setSelectedTransaction(null);
        }
      };

      fetchTransactionDetails();
    } else if (!selectedTransactionId) {
      setSelectedTransaction(null);
    }
  }, [selectedTransactionId, shouldUseAPI]);

  // Category Actions with loading states
  const handleCreateCategory = async (name: string) => {
    await withLoading('categories', async () => {
      await CategoryService.createCategory(name);
      if (!shouldUseAPI) {
        const updatedCategories = await CategoryService.getCategories();
        setLocalCategories(updatedCategories);
      } else {
        await refetchCategories();
      }
    });
    resetCategoryForm();
    success('Kategori berhasil ditambahkan');
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    await withLoading('categories', async () => {
      await CategoryService.updateCategory(id, name);
      if (!shouldUseAPI) {
        const updatedCategories = await CategoryService.getCategories();
        setLocalCategories(updatedCategories);
      } else {
        await refetchCategories();
      }
    });
    resetCategoryForm();
    success('Kategori berhasil diperbarui');
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
      await withLoading('deleting', async () => {
        await CategoryService.deleteCategory(id);
        if (!shouldUseAPI) {
          const updatedCategories = await CategoryService.getCategories();
          setLocalCategories(updatedCategories);
        } else {
          await refetchCategories();
        }
      });
      success('Kategori berhasil dihapus');
    }
  };

  // Product Actions with loading states
  const handleCreateProduct = async () => {
    const priceValue = Number(productForm.price);
    const stockValue = Number(productForm.stock || "0");

    if (Number.isNaN(priceValue) || priceValue <= 0) {
      error('Harga tidak valid');
      return;
    }
    if (stockValue < 0) {
      error('Stok tidak boleh negatif');
      return;
    }
    if (!productForm.categoryId) {
      error('Pilih kategori');
      return;
    }

    await withLoading('saving', async () => {
      await ProductService.createProduct({
        name: productForm.name,
        price: priceValue,
        stock: stockValue,
        categoryId: productForm.categoryId,
        photo: productForm.photo,
      });

      if (!shouldUseAPI) {
        const updatedProducts = await ProductService.getProducts();
        // setLocalProducts(updatedProducts);
      } else {
        await refetchProducts();
      }
    });
    resetProductForm();
    success('Produk berhasil ditambahkan');
  };

  const handleUpdateProduct = async () => {
    if (!editingProductId) return;

    const priceValue = Number(productForm.price);
    const stockValue = Number(productForm.stock || "0");

    if (Number.isNaN(priceValue) || priceValue <= 0) {
      error('Harga tidak valid');
      return;
    }
    if (stockValue < 0) {
      error('Stok tidak boleh negatif');
      return;
    }

    await withLoading('saving', async () => {
      await ProductService.updateProduct(editingProductId, {
        name: productForm.name,
        price: priceValue,
        stock: stockValue,
        categoryId: productForm.categoryId,
        photo: productForm.photo,
      });

      if (!shouldUseAPI) {
        const updatedProducts = await ProductService.getProducts();
        // setLocalProducts(updatedProducts);
      } else {
        await refetchProducts();
      }
    });
    resetProductForm();
    success('Produk berhasil diperbarui');
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
      await withLoading('deleting', async () => {
        await ProductService.deleteProduct(id);
        if (!shouldUseAPI) {
          const updatedProducts = await ProductService.getProducts();
          // setLocalProducts(updatedProducts);
        } else {
          await refetchProducts();
        }
      });
      success('Produk berhasil dihapus');
    }
  };

  // Enhanced Transaction Actions
  const handleAddToCart = async (productId: string) => {
    const product = products.find(item => item.id === productId);
    if (!product) {
      error('Produk tidak ditemukan');
      return;
    }

    if (product.stock <= 0) {
      info('Stok produk kosong');
      return;
    }

    // Check if adding more than available stock
    const currentQty = getItemQuantity(productId);
    if (currentQty >= product.stock) {
      info('Stok tidak mencukupi');
      return;
    }

    addToCart(product);
    setTransactionSearch("");
  };

  const handleSaveTransaction = async () => {
    if (cart.length === 0) {
      error('Keranjang kosong');
      return;
    }

    const paidValue = Number(cash);
    if (Number.isNaN(paidValue) || paidValue < cartSubtotal) {
      error('Tunai belum mencukupi');
      return;
    }

    // Validasi stok sebelum pembayaran
    const stockValidation = validateCartStock(cart, products);
    if (!stockValidation.isValid) {
      error(stockValidation.errorMessage || 'Terjadi kesalahan validasi stok');
      return;
    }

    const transactionData = {
      items: cart,
      subtotal: cartSubtotal,
      total: cartSubtotal,
      paid: paidValue,
      change: paidValue - cartSubtotal,
    };

    await withLoading('saving', async () => {
      try {
        const newTransaction = await TransactionService.createTransaction(transactionData);

        if (!shouldUseAPI) {
          setLocalTransactions(prev => [newTransaction, ...prev]);
        }

        clearCart();
        setCash("0");
        setTransactionSearch("");
        setSelectedTransactionId(newTransaction.id);
        setSummaryModal({ show: false, transaction: newTransaction });
      } catch (err) {
        // Error handled in TransactionService
      }
    });
  };

  // Generate comprehensive report data
  const reportData = DataTransformationUtils.generateSalesReport(
    shouldUseAPI ? [] : localTransactions,
    products,
    categories
  );

  // Search and filter products
  const searchProducts = (searchTerm: string, categoryId?: string) => {
    return DataTransformationUtils.searchProducts(products, {
      searchTerm,
      categoryId,
      inStock: true,
    });
  };

  const filteredProducts = searchProducts(productSearch, productFilter);
  const matchingProducts = searchProducts(transactionSearch, transactionCategoryFilter).slice(0, 6);

  // Calculate change
  const change = Number(cash || "0") - cartSubtotal;

  const validateCartStock = (cart: TransactionItem[], products: Product[]) => {
    for (const item of cart) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return {
          isValid: false,
          errorMessage: `Produk "${item.name}" tidak ditemukan`
        };
      }

      if (product.stock < item.qty) {
        const availableStock = product.stock;
        const productName = product.name;

        if (availableStock === 0) {
          return {
            isValid: false,
            errorMessage: `Produk "${productName}" sudah habis`
          };
        } else {
          return {
            isValid: false,
            errorMessage: `Stok "${productName}" tidak mencukupi. Tersedia: ${availableStock} pcs, Diminta: ${item.qty} pcs`
          };
        }
      }
    }

    return { isValid: true };
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Validasi stok saat update quantity
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      error(`Stok "${product.name}" tidak mencukupi. Maksimal: ${product.stock} pcs`);
      return;
    }

    updateQuantity(productId, quantity);
  };

  const confirmSaveTransaction = () => {
    if (!summaryModal.transaction) return;
    handleSaveTransaction();
  };

  const cancelSaveTransaction = () => {
    setSummaryModal({ show: false, transaction: null });
  };

  // Generate receipt
  const handleGenerateReceipt = (transaction: any) => {
    receiptService.generateReceipt({
      transaction
    }).catch(err => {
      console.error('Failed to generate receipt:', err);
      error('Gagal generate struk');
    });
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (transaction: any) => {
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
      setDateRange({
        start: startDate.toISOString().split("T")[0],
        end
      });
      return;
    }
    if (type === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      setDateRange({ start, end });
    }
  };

  // Helper functions
  const productNameById = (id: string) =>
    products.find(item => item.id === id)?.name ?? "-";

  const shortDate = (value: string) =>
    new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });

  return {
    // Navigation
    moduleNavItems,
    activeModule,
    setActiveModule,
    activeNav,

    // Loading states
    isLoading,

    // Module data with enhanced transformations
    omzetData: {
      todayTransactionsCount: shouldUseAPI && dashboardData ? dashboardData.todayTransactionsCount : reportData.weeklyTrend[6]?.total || 0,
      todayRevenue: shouldUseAPI && dashboardData ? dashboardData.todayRevenue : reportData.weeklyTrend[6]?.total || 0,
      topProduct: shouldUseAPI && dashboardData ? dashboardData.topProduct : reportData.topSellingProduct,
      weeklyTrend: shouldUseAPI && dashboardData ? dashboardData.weeklyTrend : reportData.weeklyTrend,
      maxWeeklyTotal: shouldUseAPI && dashboardData ? dashboardData.maxWeeklyTotal : DataTransformationUtils.calculateMaxWeeklyTotal(reportData.weeklyTrend),
      latestTransactions: shouldUseAPI && dashboardData ? dashboardData.latestTransactions : DataTransformationUtils.getLatestTransactions(shouldUseAPI ? [] : localTransactions),
      totalRevenue: shouldUseAPI && dashboardData ? dashboardData.totalRevenue : reportData.totalRevenue,
      averageOrder: shouldUseAPI && dashboardData ? dashboardData.averageOrder : reportData.averageOrderValue,
      totalTransactions: shouldUseAPI && dashboardData ? dashboardData.totalTransactions : reportData.totalTransactions,
      currency,
      formatDateTime,
      isLoading: isLoading('dashboard'),
      error: shouldUseAPI ? (appError || undefined) : undefined,
    },

    productsData: {
      categories,
      filteredProducts,
      productFilter,
      productSearch,
      productForm,
      editingProductId,
      categoryForm,
      editingCategoryId,
      isLoading: isLoading('categories') || isLoading('products'),
      error: shouldUseAPI ? (appError || undefined) : undefined,
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
        resetCategoryForm();
        setEditingCategoryId(null);
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
    },

    transactionsData: {
      categories,
      transactionSearch,
      setTransactionSearch,
      matchingProducts,
      handleAddToCart,
      cart,
      products,
      updateCartQty: updateCartQty,
      removeCartItem: removeFromCart,
      cartSubtotal,
      cash,
      setCash,
      change,
      handleSaveTransaction: () => {
        if (cart.length === 0) {
          error('Keranjang kosong');
          return;
        }
        const paidValue = Number(cash);
        if (Number.isNaN(paidValue) || paidValue < cartSubtotal) {
          error('Tunai belum mencukupi');
          return;
        }

        // Validasi stok sebelum pembayaran
        const stockValidation = validateCartStock(cart, products);
        if (!stockValidation.isValid) {
          error(stockValidation.errorMessage || 'Terjadi kesalahan validasi stok');
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
        };

        setSummaryModal({ show: true, transaction: newTransaction });
      },
      stockLogs: stockLogs, // Use API data from useAppState (real-time from backend)
      currency,
      transactionCategoryFilter,
      setTransactionCategoryFilter,
    },

    receiptsData: {
      transactions: shouldUseAPI ? [] : localTransactions,
      formatDateTime,
      handleGenerateReceipt,
      handleShareWhatsApp,
    },

    reportsData: {
      filteredTransactions: DataTransformationUtils.filterTransactionsByDateRange(
        shouldUseAPI ? [] : localTransactions,
        dateRange
      ),
      dateRange,
      setDateRange,
      quickFilter,
      shortDate,
      currency,
      setSelectedTransactionId,
    },

    // Modal state
    summaryModal,
    confirmSaveTransaction,
    cancelSaveTransaction,

    // Additional utilities
    isInCart,
    getItemQuantity,
    searchProducts,
    reportData,
  };
}