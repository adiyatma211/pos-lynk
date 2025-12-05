// Configuration helper to check if app should use API or localStorage
export const useAPI = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_API === 'true';
};

// Get API base URL
export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
};

// Storage keys for localStorage fallback
export const STORAGE_KEYS = {
  categories: 'poslynk-categories',
  products: 'poslynk-products',
  transactions: 'poslynk-transactions',
  stockLogs: 'poslynk-stock-logs',
} as const;

// Error messages for API fallback
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Menggunakan data lokal.',
  SERVER_ERROR: 'Server mengalami masalah. Menggunakan data lokal.',
  AUTH_ERROR: 'Autentikasi diperlukan.',
  VALIDATION_ERROR: 'Data yang dikirim tidak valid.',
  DEFAULT: 'Terjadi kesalahan. Silakan coba lagi.',
} as const;