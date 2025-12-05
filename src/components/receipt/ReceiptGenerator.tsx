"use client";

import { receiptService } from "@/services/receiptService";
import type { GenerateReceiptRequest, ReceiptOptions } from "@/types/receipt";
import { DEFAULT_RECEIPT_CONFIG } from "@/config/receiptConfig";
import { formatDateTime } from "@/utils/formatHelpers";
import type { Transaction } from "@/types/pos";

interface ReceiptGeneratorProps {
  /** Transaction data */
  transaction: Transaction;
  /** Optional filename override */
  filename?: string;
  /** Custom options */
  options?: ReceiptOptions;
  /** Auto-open print dialog */
  autoPrint?: boolean;
}

/**
 * ReceiptGenerator Component
 *
 * Component untuk generate dan cetak receipt/struk
 * Memisahkan PDF logic dari POS main logic
 */
export function ReceiptGenerator({
  transaction,
  filename,
  options = {},
  autoPrint = false
}: ReceiptGeneratorProps) {

  /**
   * Generate receipt PDF
   */
  const generateReceipt = async () => {
    const request: GenerateReceiptRequest = {
      transaction,
      options: {
        ...options,
        filename,
        openPrintDialog: autoPrint
      }
    };

    const result = await receiptService.generateReceipt(request);

    if (!result.success) {
      console.error('❌ Failed to generate receipt:', result.error);
      return;
    }

    console.log(`✅ Receipt generated: ${result.filename}`);
  };

  /**
   * Share receipt via WhatsApp
   */
  const shareWhatsApp = () => {
    const lines = [
      `Struk Sentosa POS`,
      `ID: ${transaction.id}`,
      `Tanggal: ${formatDateTime(transaction.createdAt)}`,
      "",
    ];

    transaction.items.forEach((item) =>
      lines.push(`${item.name} x${item.qty} = ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(item.price * item.qty)}`),
    );

    lines.push("", `Total: ${new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(transaction.total)}`, `Tunai: ${new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(transaction.paid)}`);
    lines.push(`Kembalian: ${new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(transaction.change)}`);

    const url = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank");
  };

  /**
   * Get receipt as blob for custom handling
   */
  const getReceiptBlob = async () => {
    const request: GenerateReceiptRequest = { transaction, options };
    return await receiptService.getReceiptBlob(request);
  };

  return (
    <div className="space-y-2">
      {/* Generate Receipt Button */}
      <button
        type="button"
        onClick={generateReceipt}
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        📄 Generate PDF Receipt
      </button>

      {/* Print Directly Button */}
      <button
        type="button"
        onClick={() => generateReceipt()}
        className="w-full rounded-xl bg-green-600 px-4 py-2 text-base font-semibold text-white shadow-lg transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        🖨️ Print Receipt
      </button>

      {/* Share WhatsApp Button */}
      <button
        type="button"
        onClick={shareWhatsApp}
        className="w-full rounded-xl border border-green-600 bg-green-50 px-4 py-2 text-base font-semibold text-green-600 shadow-lg transition hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        💬 Share via WhatsApp
      </button>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <h4 className="font-semibold mb-2">🔍 Debug Information</h4>
          <div className="space-y-1 text-xs">
            <p><strong>Transaction ID:</strong> {transaction.id}</p>
            <p><strong>Items:</strong> {transaction.items.length}</p>
            <p><strong>Total:</strong> {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(transaction.total)}</p>
            <p><strong>Auto-Print:</strong> {DEFAULT_RECEIPT_CONFIG.autoPrint ? 'Enabled' : 'Disabled'}</p>
            <p><strong>Config:</strong> Thermal (58mm) Printer</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceiptGenerator;