import type { Transaction, TransactionItem } from './pos';

/**
 * Receipt generation configuration
 */
export interface ReceiptConfig {
  /** Auto-print receipts when generated */
  autoPrint: boolean;
  /** Thermal printer width in millimeters */
  width: number;
  /** Show print notifications in console */
  showPrintNotification: boolean;
  /** Receipt template type */
  template: ReceiptTemplate;
}

/**
 * Available receipt templates
 */
export type ReceiptTemplate = 'thermal' | 'standard' | 'minimal';

/**
 * Receipt generation options
 */
export interface ReceiptOptions {
  /** Override default configuration */
  config?: Partial<ReceiptConfig>;
  /** Custom filename (without extension) */
  filename?: string;
  /** Open print dialog after generation */
  openPrintDialog?: boolean;
}

/**
 * Receipt footer options
 */
export interface ReceiptFooter {
  thankYouMessage?: string;
  returnPolicy?: string;
  paymentMethods?: string;
  showQRCode?: boolean;
  qrCodeMessage?: string;
}

/**
 * Receipt header options
 */
export interface ReceiptHeader {
  storeName?: string;
  address?: string;
  phone?: string;
  showKasir?: boolean;
  kasirName?: string;
}

/**
 * Receipt item formatting options
 */
export interface ReceiptItemFormat {
  maxItemNameLength?: number;
  showUnitPrice?: boolean;
  showQuantity?: boolean;
  showTotal?: boolean;
}

/**
 * Complete receipt generation request
 */
export interface GenerateReceiptRequest {
  /** Transaction data */
  transaction: Transaction;
  /** Generation options */
  options?: ReceiptOptions;
  /** Custom header */
  header?: ReceiptHeader;
  /** Custom footer */
  footer?: ReceiptFooter;
  /** Item formatting */
  itemFormat?: ReceiptItemFormat;
}

/**
 * Receipt generation result
 */
export interface ReceiptGenerationResult {
  /** Success status */
  success: boolean;
  /** Generated filename */
  filename: string;
  /** Error message if failed */
  error?: string;
  /** Blob data for custom handling */
  blob?: Blob;
  /** Data URL for preview/print */
  dataUrl?: string;
}

/**
 * Receipt service interface
 */
export interface IReceiptService {
  /** Generate receipt PDF */
  generateReceipt(request: GenerateReceiptRequest): Promise<ReceiptGenerationResult>;
  /** Print receipt directly */
  printReceipt(request: GenerateReceiptRequest): Promise<ReceiptGenerationResult>;
  /** Get receipt as blob */
  getReceiptBlob(request: GenerateReceiptRequest): Promise<Blob>;
  /** Get receipt as data URL */
  getReceiptDataUrl(request: GenerateReceiptRequest): Promise<string>;
}