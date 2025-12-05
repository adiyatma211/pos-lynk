import { jsPDF } from 'jspdf';
import type {
  GenerateReceiptRequest,
  ReceiptGenerationResult,
  IReceiptService,
  ReceiptOptions,
  ReceiptHeader,
  ReceiptFooter,
  ReceiptItemFormat,
  ReceiptConfig
} from '@/types/receipt';
import {
  DEFAULT_RECEIPT_CONFIG,
  DEFAULT_RECEIPT_HEADER,
  DEFAULT_RECEIPT_FOOTER,
  DEFAULT_ITEM_FORMAT,
  FONT_SIZES,
  LAYOUT_CONFIGS,
  getTemplateConfig,
  createReceiptConfig,
  STORE_INFO,
} from '@/config/receiptConfig';
import { formatDateTime, currency } from '@/utils/formatHelpers';
import { useAPI, getApiBaseUrl } from '@/utils/config';

// Define transaction interface for type safety
interface ReceiptTransaction {
  id: string; // Match the expected Transaction type
  referenceId?: string | number;
  createdAt: string;
  items: ReceiptItem[];
  subtotal: number;
  total: number;
  paid: number;
  change: number;
}

interface ReceiptItem {
  name: string;
  price: number;
  qty: number;
  productId?: string; // Add productId to match TransactionItem
}

/**
 * Receipt Service - Handles PDF generation for receipts
 */
export class ReceiptService implements IReceiptService {
  private config = DEFAULT_RECEIPT_CONFIG;
  private apiEndpoint = '/receipts';

  constructor(config?: Partial<ReceiptConfig>) {
    this.config = createReceiptConfig(this.config, config);
  }

  /**
   * Generate receipt PDF
   */
  async generateReceipt(request: GenerateReceiptRequest): Promise<ReceiptGenerationResult> {
    try {
      const { transaction, options, header, footer, itemFormat } = request;

      // Check if should use API
      if (this.shouldUseAPI()) {
        return await this.generateReceiptViaAPI(transaction, options);
      }

      // Generate locally
      return await this.generateReceiptLocally(request);
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate receipt via API
   */
  private async generateReceiptViaAPI(transaction: ReceiptTransaction, options?: ReceiptOptions): Promise<ReceiptGenerationResult> {
    try {
      console.log('🔄 Starting receipt upload to API...');
      
      // Upload the locally generated PDF to backend
      const localResult = await this.generateReceiptLocally({
        transaction: {
          ...transaction,
          id: String(transaction.id),
          referenceId: typeof transaction.referenceId === 'string' ? parseInt(transaction.referenceId) : transaction.referenceId,
          items: transaction.items.map(item => ({
            ...item,
            productId: item.productId || item.name // Ensure productId exists
          })),
          hasReceipt: false,
          receiptGeneratedAt: null,
          receiptDownloadUrl: null,
        },
        options: options || {} // Use options or empty object
      });

      if (!localResult.success || !localResult.blob) {
        console.error('❌ Failed to generate local PDF');
        throw new Error('Failed to generate local PDF');
      }

      // Create FormData for upload
      const formData = new FormData();
      // Ensure transaction_id is sent as integer for consistency with backend
      // Use referenceId (numeric database ID) first, then fallback to id (code)
      let transactionId = transaction.referenceId;
      
      // If referenceId is not available, we need to look up the transaction by code to get the ID
      if (!transactionId && transaction.id) {
        // Try to parse if it's a numeric ID, otherwise we need to fetch the transaction
        const parsedId = parseInt(transaction.id.toString());
        if (!isNaN(parsedId)) {
          transactionId = parsedId;
        } else {
          // This is a transaction code, we need to get the numeric ID from API
          throw new Error(`Transaction code "${transaction.id}" cannot be used for receipt upload. Please use transaction.referenceId instead.`);
        }
      }
      
      if (!transactionId) {
        throw new Error('Transaction ID (referenceId) is required for receipt upload');
      }
      
      const parsedTransactionId = transactionId.toString();
      
      // Use proper API base URL for consistency with other services
      const fullApiUrl = `${getApiBaseUrl()}${this.apiEndpoint}/upload`;
      
      console.log('📤 Uploading receipt:', {
        endpoint: fullApiUrl,
        transactionId: parsedTransactionId,
        filename: localResult.filename,
        apiBaseUrl: getApiBaseUrl(),
        relativeEndpoint: this.apiEndpoint
      });
      
      formData.append('transaction_id', parsedTransactionId);
      formData.append('receipt_file', localResult.blob, localResult.filename);

      console.log('🌐 Making request to:', fullApiUrl);
      console.log('📋 FormData contents:', {
        transaction_id: parsedTransactionId,
        receipt_file: localResult.filename,
        fileSize: localResult.blob.size
      });

      const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type for FormData - browser sets it automatically with boundary
        },
        body: formData,
      });

      console.log('📥 API Response status:', response.status);
      console.log('📥 API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Upload Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: response.url
        });
        throw new Error(`API Upload Error: ${response.statusText} (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ API Response:', result);

      if (result.success || result.data) {
        // Show notifications
        this.showNotifications(options, result.data?.filename?.replace('.pdf', '') || localResult.filename.replace('.pdf', ''));

        return {
          success: true,
          filename: result.data?.filename || localResult.filename,
          error: undefined,
          blob: localResult.blob, // Keep the blob for download
          dataUrl: result.data?.url,
        };
      } else {
        console.error('❌ API returned error:', result.message);
        throw new Error(result.message || 'Failed to upload receipt');
      }
    } catch (error) {
      console.error('💥 Receipt upload failed:', error);
      console.error('💥 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      throw error;
    }
  }

  /**
   * Generate receipt locally (fallback)
   */
  private async generateReceiptLocally(request: GenerateReceiptRequest): Promise<ReceiptGenerationResult> {
    const { transaction, options, header, footer, itemFormat } = request;

    // Generate filename
    const filename = options?.filename || `struk-${transaction.id}`;

    // Create PDF document
    const doc = this.createPDFDocument(options);

    // Generate receipt content
    this.generateReceiptContent(doc, transaction, header, footer, itemFormat);

    // Generate blob and data URL
    const blob = doc.output('blob');
    const dataUrl = URL.createObjectURL(blob);

    // Save file
    doc.save(`${filename}.pdf`);

    // Auto-print if enabled
    if (options?.openPrintDialog !== false && this.config.autoPrint) {
      await this.openPrintDialog(blob);
    }

    // Show notifications
    this.showNotifications(options, filename);

    return {
      success: true,
      filename: `${filename}.pdf`,
      blob,
      dataUrl,
    };
  }

  /**
   * Check if should use API
   */
  private shouldUseAPI(): boolean {
    // Use the same logic as other services for consistency
    // useAPI is a regular function, not a React hook
    const shouldUse = process.env.NEXT_PUBLIC_USE_API === 'true';
    console.log(`[ReceiptService] shouldUseAPI: ${shouldUse} (NEXT_PUBLIC_USE_API: ${process.env.NEXT_PUBLIC_USE_API})`);
    return shouldUse;
  }

  /**
   * Print receipt directly
   */
  async printReceipt(request: GenerateReceiptRequest): Promise<ReceiptGenerationResult> {
    const result = await this.generateReceipt({
      ...request,
      options: {
        ...request.options,
        openPrintDialog: true,
      },
    });

    return result;
  }

  /**
   * Get receipt as blob
   */
  async getReceiptBlob(request: GenerateReceiptRequest): Promise<Blob> {
    const { transaction, header, footer, itemFormat } = request;

    const doc = this.createPDFDocument();
    this.generateReceiptContent(doc, transaction, header, footer, itemFormat);

    return doc.output('blob');
  }

  /**
   * Get receipt as data URL
   */
  async getReceiptDataUrl(request: GenerateReceiptRequest): Promise<string> {
    const blob = await this.getReceiptBlob(request);
    return URL.createObjectURL(blob);
  }

  /**
   * Create PDF document with proper configuration
   */
  private createPDFDocument(options?: ReceiptOptions) {
    const templateConfig = getTemplateConfig(this.config.template);

    return new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [options?.config?.width || this.config.width, 200],
    });
  }

  /**
   * Generate complete receipt content
   */
  private generateReceiptContent(
    doc: jsPDF,
    transaction: ReceiptTransaction,
    header?: ReceiptHeader,
    footer?: ReceiptFooter,
    itemFormat?: ReceiptItemFormat
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    let cursorY: number = LAYOUT_CONFIGS.margins.top;

    // Generate header
    cursorY = this.generateHeader(doc, centerX, cursorY, header);

    // Generate transaction info
    cursorY = this.generateTransactionInfo(doc, cursorY, transaction);

    // Generate items
    cursorY = this.generateItems(doc, pageWidth, cursorY, transaction.items, itemFormat);

    // Generate summary
    cursorY = this.generateSummary(doc, pageWidth, cursorY, transaction);

    // Generate footer
    cursorY = this.generateFooter(doc, centerX, cursorY, footer);

    // Generate tear line
    this.generateTearLine(doc, pageWidth, cursorY);
  }

  /**
   * Generate receipt header
   */
  private generateHeader(doc: jsPDF, centerX: number, cursorY: number, header?: ReceiptHeader): number {
    const headerConfig = { ...DEFAULT_RECEIPT_HEADER, ...header };

    // Store name
    doc.setFontSize(FONT_SIZES.header.title);
    doc.setFont('helvetica', 'bold');
    doc.text(headerConfig.storeName || STORE_INFO.name, centerX, cursorY, { align: 'center' });
    cursorY += 8;

    // Store address
    doc.setFontSize(FONT_SIZES.header.subtitle);
    doc.setFont('helvetica', 'normal');
    if (headerConfig.address) {
      doc.text(headerConfig.address, centerX, cursorY, { align: 'center' });
      cursorY += 5;
    }

    // Store phone
    if (headerConfig.phone) {
      doc.text(headerConfig.phone, centerX, cursorY, { align: 'center' });
      cursorY += 8;
    }

    // Separator line
    doc.setLineWidth(LAYOUT_CONFIGS.lines.separator);
    doc.line(LAYOUT_CONFIGS.margins.left, cursorY, doc.internal.pageSize.getWidth() - LAYOUT_CONFIGS.margins.right, cursorY);
    cursorY += 6;

    return cursorY;
  }

  /**
   * Generate transaction information
   */
  private generateTransactionInfo(doc: jsPDF, cursorY: number, transaction: ReceiptTransaction): number {
    doc.setFontSize(FONT_SIZES.body.label);
    doc.text(`ID: ${transaction.id}`, LAYOUT_CONFIGS.margins.left, cursorY);
    cursorY += 5;

    if (DEFAULT_RECEIPT_HEADER.showKasir) {
      doc.text(`Kasir: ${DEFAULT_RECEIPT_HEADER.kasirName || 'Admin'}`, LAYOUT_CONFIGS.margins.left, cursorY);
      cursorY += 5;
    }

    // Date and time
    const date = new Date(transaction.createdAt);
    doc.text(date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }), LAYOUT_CONFIGS.margins.left, cursorY);
    cursorY += 8;

    return cursorY;
  }

  /**
   * Generate receipt items
   */
  private generateItems(
    doc: jsPDF,
    pageWidth: number,
    cursorY: number,
    items: ReceiptItem[],
    itemFormat?: ReceiptItemFormat
  ): number {
    const formatConfig = { ...DEFAULT_ITEM_FORMAT, ...itemFormat };

    // Items header
    doc.setFont('helvetica', 'bold');
    doc.text('Item', LAYOUT_CONFIGS.margins.left, cursorY);

    if (formatConfig.showQuantity) {
      doc.text('Qty', pageWidth - 25, cursorY, { align: 'right' });
    }

    if (formatConfig.showTotal) {
      doc.text('Total', pageWidth - LAYOUT_CONFIGS.margins.right, cursorY, { align: 'right' });
    }

    cursorY += 6;
    doc.setFont('helvetica', 'normal');

    // Items list
    items.forEach((item) => {
      // Item name
      const itemName = formatConfig.maxItemNameLength && item.name.length > formatConfig.maxItemNameLength
        ? item.name.substring(0, formatConfig.maxItemNameLength) + '...'
        : item.name;
      doc.text(itemName, LAYOUT_CONFIGS.margins.left, cursorY);

      // Quantity and unit price
      if (formatConfig.showUnitPrice && formatConfig.showQuantity) {
        const qtyPriceText = `${item.qty}x${currency(item.price)}`;
        doc.text(qtyPriceText, pageWidth - 25, cursorY, { align: 'right' });
      } else if (formatConfig.showQuantity) {
        doc.text(`${item.qty}`, pageWidth - 25, cursorY, { align: 'right' });
      }

      // Item total
      if (formatConfig.showTotal) {
        doc.text(currency(item.price * item.qty), pageWidth - LAYOUT_CONFIGS.margins.right, cursorY, { align: 'right' });
      }

      cursorY += 6;
    });

    cursorY += 4;

    // Separator line
    doc.setLineWidth(LAYOUT_CONFIGS.lines.separator);
    doc.line(LAYOUT_CONFIGS.margins.left, cursorY, pageWidth - LAYOUT_CONFIGS.margins.right, cursorY);
    cursorY += 6;

    return cursorY;
  }

  /**
   * Generate payment summary
   */
  private generateSummary(doc: jsPDF, pageWidth: number, cursorY: number, transaction: ReceiptTransaction): number {
    doc.setFontSize(FONT_SIZES.body.label);

    doc.text('Subtotal:', LAYOUT_CONFIGS.margins.left, cursorY);
    doc.text(currency(transaction.subtotal), pageWidth - LAYOUT_CONFIGS.margins.right, cursorY, { align: 'right' });
    cursorY += 5;

    doc.text('Total:', LAYOUT_CONFIGS.margins.left, cursorY);
    doc.text(currency(transaction.total), pageWidth - LAYOUT_CONFIGS.margins.right, cursorY, { align: 'right' });
    cursorY += 5;

    doc.text('Tunai:', LAYOUT_CONFIGS.margins.left, cursorY);
    doc.text(currency(transaction.paid), pageWidth - LAYOUT_CONFIGS.margins.right, cursorY, { align: 'right' });
    cursorY += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Kembali:', LAYOUT_CONFIGS.margins.left, cursorY);
    doc.text(currency(transaction.change), pageWidth - LAYOUT_CONFIGS.margins.right, cursorY, { align: 'right' });
    cursorY += 8;
    doc.setFont('helvetica', 'normal');

    return cursorY;
  }

  /**
   * Generate receipt footer
   */
  private generateFooter(doc: jsPDF, centerX: number, cursorY: number, footer?: ReceiptFooter): number {
    const footerConfig = { ...DEFAULT_RECEIPT_FOOTER, ...footer };

    // Footer separator
    doc.setLineWidth(LAYOUT_CONFIGS.lines.separator);
    doc.line(LAYOUT_CONFIGS.margins.left, cursorY, doc.internal.pageSize.getWidth() - LAYOUT_CONFIGS.margins.right, cursorY);
    cursorY += 6;

    doc.setFontSize(FONT_SIZES.body.footer);

    // Thank you message
    if (footerConfig.thankYouMessage) {
      doc.text(footerConfig.thankYouMessage, centerX, cursorY, { align: 'center' });
      cursorY += 5;
    }

    // Return policy
    if (footerConfig.returnPolicy) {
      doc.text(footerConfig.returnPolicy, centerX, cursorY, { align: 'center' });
      cursorY += 5;
    }

    // Payment methods
    if (footerConfig.paymentMethods) {
      doc.text(footerConfig.paymentMethods, centerX, cursorY, { align: 'center' });
      cursorY += 8;
    }

    // QR code
    if (footerConfig.showQRCode) {
      cursorY = this.generateQRCode(doc, centerX, cursorY);
    }

    return cursorY;
  }

  /**
   * Generate QR code placeholder
   */
  private generateQRCode(doc: jsPDF, centerX: number, cursorY: number): number {
    const qrSize = 20;
    const qrX = (doc.internal.pageSize.getWidth() - qrSize) / 2;

    doc.setLineWidth(LAYOUT_CONFIGS.lines.tear);
    doc.rect(qrX, cursorY, qrSize, qrSize);

    // Simple QR pattern (dots)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if ((i + j) % 2 === 0) {
          doc.circle(qrX + 4 + i * 4, cursorY + 4 + j * 4, 1.5, 'F');
        }
      }
    }

    cursorY += qrSize + 5;

    doc.setFontSize(FONT_SIZES.qr.message);
    doc.text('Scan untuk info lebih lanjut', centerX, cursorY, { align: 'center' });
    cursorY += 10;

    return cursorY;
  }

  /**
   * Generate tear line
   */
  private generateTearLine(doc: jsPDF, pageWidth: number, cursorY: number): void {
    // Additional space for clean tear
    const tearCursorY = cursorY + 10;
    doc.setLineWidth(LAYOUT_CONFIGS.lines.tear);
    // Simple solid line instead of dashed for compatibility
    doc.line(LAYOUT_CONFIGS.margins.left, tearCursorY, pageWidth - LAYOUT_CONFIGS.margins.right, tearCursorY);
  }

  /**
   * Open print dialog
   */
  private async openPrintDialog(blob: Blob): Promise<void> {
    if (typeof window === 'undefined' || !window.print) return;

    const pdfUrl = URL.createObjectURL(blob);
    const printWindow = window.open(pdfUrl);

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      };
    }
  }

  /**
   * Show console notifications
   */
  private showNotifications(options?: ReceiptOptions, filename?: string): void {
    if (!this.config.showPrintNotification) return;

    console.log(`📄 PDF ${filename} telah dibuat`);

    if (this.config.autoPrint) {
      console.log('🖨️ Auto-print diaktifkan - Dialog print akan otomatis terbuka');
    } else {
      console.log('💡 Auto-print dinonaktifkan - Untuk mengaktifkan, ubah AUTO_PRINT_RECEIPT menjadi true di src/config/receiptConfig.ts');
      console.log('📋 Atau cetak manual dari file PDF yang telah di-download');
    }
  }
}

/**
 * Create singleton receipt service instance
 */
export const receiptService = new ReceiptService();

/**
 * Default export for convenience
 */
export default receiptService;