import type { ReceiptConfig, ReceiptTemplate, ReceiptHeader, ReceiptFooter, ReceiptItemFormat } from '@/types/receipt';

/**
 * Default store information
 */
export const STORE_INFO = {
  name: 'Sentosa POS',
  address: 'Jl. Contoh No. 123, Jakarta',
  phone: '(021) 1234567',
} as const;

/**
 * Default receipt templates
 */
export const RECEIPT_TEMPLATES = {
  thermal: {
    width: 58, // 58mm thermal printer
    unit: 'mm',
    orientation: 'portrait' as const,
  },
  standard: {
    width: 80, // 80mm wider receipt
    unit: 'mm',
    orientation: 'portrait' as const,
  },
  minimal: {
    width: 58, // Compact thermal
    unit: 'mm',
    orientation: 'portrait' as const,
  },
} as const;

/**
 * Default receipt configuration
 */
export const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  autoPrint: false, // 🖨️ Change to true to enable auto-print
  width: RECEIPT_TEMPLATES.thermal.width,
  showPrintNotification: true,
  template: 'thermal',
} as const;

/**
 * Default receipt header configuration
 */
export const DEFAULT_RECEIPT_HEADER: ReceiptHeader = {
  storeName: STORE_INFO.name,
  address: STORE_INFO.address,
  phone: STORE_INFO.phone,
  showKasir: true,
  kasirName: 'Admin',
} as const;

/**
 * Default receipt footer configuration
 */
export const DEFAULT_RECEIPT_FOOTER: ReceiptFooter = {
  thankYouMessage: 'Terima kasih atas kunjungan Anda',
  returnPolicy: 'Barang yang sudah dibeli tidak dapat dikembalikan',
  paymentMethods: '',
  showQRCode: false,
  qrCodeMessage: '',
} as const;

/**
 * Default item formatting configuration
 */
export const DEFAULT_ITEM_FORMAT: ReceiptItemFormat = {
  maxItemNameLength: 15,
  showUnitPrice: true,
  showQuantity: true,
  showTotal: true,
} as const;

/**
 * Font configurations for different receipt sizes
 */
export const FONT_SIZES = {
  header: {
    title: 16,
    subtitle: 9,
  },
  body: {
    label: 9,
    content: 8,
    footer: 8,
  },
  qr: {
    message: 6,
  },
} as const;

/**
 * Layout configurations
 */
export const LAYOUT_CONFIGS = {
  margins: {
    top: 10,
    left: 5,
    right: 5,
    bottom: 10,
  },
  spacing: {
    section: 8,
    line: 6,
    item: 6,
    footer: 5,
  },
  lines: {
    separator: 0.2,
    tear: 0.1,
  },
} as const;

/**
 * Environment-based configuration
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    development: {
      ...DEFAULT_RECEIPT_CONFIG,
      autoPrint: false, // Never auto-print in development
      showPrintNotification: true,
    },
    production: {
      ...DEFAULT_RECEIPT_CONFIG,
      autoPrint: process.env.NEXT_PUBLIC_AUTO_PRINT === 'true', // Environment variable override
      showPrintNotification: true,
    },
  }[isDevelopment ? 'development' : 'production'];
};

/**
 * Merge configurations with user overrides
 */
export const createReceiptConfig = (
  baseConfig: ReceiptConfig = DEFAULT_RECEIPT_CONFIG,
  overrides?: Partial<ReceiptConfig>
): ReceiptConfig => ({
  ...baseConfig,
  ...overrides,
});

/**
 * Get template configuration by type
 */
export const getTemplateConfig = (template: ReceiptTemplate) => {
  return RECEIPT_TEMPLATES[template];
};