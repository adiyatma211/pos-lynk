import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, X, Plus, Edit, Trash2, ShoppingBag, Package } from 'lucide-react';

// Simple Toaster with basic styling
export const AppToaster = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        top: 20,
        left: 20,
        bottom: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          fontSize: '14px',
          maxWidth: '400px',
          color: '#1a1a1a',
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          duration: 5000,
        },
      }}
    />
  );
};

// Toast helper functions with specific CRUD operations
export const showToast = {
  // Generic toast functions
  success: (message: string, description?: string) =>
    toast.success(message),

  error: (message: string, description?: string) =>
    toast.error(description ? `${message}: ${description}` : message, {
      duration: 5000,
    }),

  warning: (message: string, description?: string) =>
    toast(message, {
      icon: <AlertCircle size={20} className="text-yellow-500" />,
    }),

  info: (message: string, description?: string) =>
    toast(message, {
      icon: <Info size={20} className="text-blue-500" />,
    }),

  // Product operations
  productAdded: (productName?: string) =>
    toast.success(productName ? `Produk "${productName}" berhasil ditambahkan!` : 'Produk berhasil ditambahkan!', {
      icon: <Plus size={20} />,
    }),

  productUpdated: (productName?: string) =>
    toast.success(productName ? `Produk "${productName}" berhasil diperbarui!` : 'Produk berhasil diperbarui!', {
      icon: <Edit size={20} />,
    }),

  productDeleted: (productName?: string) =>
    toast.success(productName ? `Produk "${productName}" berhasil dihapus!` : 'Produk berhasil dihapus!', {
      icon: <Trash2 size={20} />,
    }),

  // Category operations
  categoryAdded: (categoryName?: string) =>
    toast.success('Kategori berhasil ditambahkan!', {
      icon: <Plus size={20} />,
    }),

  categoryUpdated: (categoryName?: string) =>
    toast.success('Kategori berhasil diperbarui!', {
      icon: <Edit size={20} />,
    }),

  categoryDeleted: (categoryName?: string) =>
    toast.success('Kategori berhasil dihapus!', {
      icon: <Trash2 size={20} />,
    }),

  // Cart operations
  addToCart: (productName?: string) =>
    toast.success('Produk ditambahkan ke keranjang!', {
      duration: 2000,
      icon: <ShoppingBag size={20} />,
    }),

  removeFromCart: (productName?: string) =>
    toast('Produk dihapus dari keranjang', {
      duration: 2000,
      icon: <X size={20} />,
    }),

  cartUpdated: (productName?: string) =>
    toast('Jumlah produk diperbarui', {
      duration: 2000,
      icon: <Edit size={20} />,
    }),

  // Transaction operations
  transactionSaved: (totalItems?: number, totalAmount?: number) => {
    const message = totalItems
      ? `${totalItems} item berhasil diproses${totalAmount ? ` • Rp ${totalAmount.toLocaleString()}` : ''}`
      : 'Transaksi berhasil diproses';

    return toast.success(message, {
      icon: <Package size={20} />,
    });
  },

  // Loading states
  loading: (message: string) =>
    toast.loading(message),

  // Utility functions
  dismiss: (toastId?: string) => toast.dismiss(toastId),

  // Custom icon toasts
  custom: (message: string, icon: React.ReactNode, options?: any) =>
    toast(message, {
      icon,
      ...options,
    }),
};

export default showToast;