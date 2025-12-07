import { useEffect } from 'react';
import type { Transaction } from '@/types/pos';
import { currency, formatDateTime } from '@/utils/formatHelpers';
import { X, Download, Share2, FileText } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateReceipt: (transaction: Transaction) => void;
  onShareWhatsApp: (transaction: Transaction) => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
  onGenerateReceipt,
  onShareWhatsApp,
}: TransactionDetailModalProps) {
  // Add escape key listener with cleanup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [onClose]);

  if (!isOpen || !transaction) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden transform transition-all duration-200 scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--color-primary)]/10">
                <FileText className="text-[var(--color-primary)]" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Detail Transaksi</h2>
                <p className="text-sm text-[var(--text-muted)]">{transaction.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-secondary)]/30 rounded-xl transition-colors"
            >
              <X size={20} className="text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">Tanggal & Waktu</p>
                  <p className="font-medium text-[var(--foreground)]">{formatDateTime(transaction.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">ID Transaksi</p>
                  <p className="font-medium text-[var(--foreground)]">{transaction.id}</p>
                </div>
              </div>

              {/* Items Detail */}
              <div>
                <h3 className="font-semibold text-[var(--foreground)] mb-3">Detail Produk</h3>
                <div className="border border-[var(--card-border)] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[var(--color-secondary)]/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                          Produk
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                          Harga
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {transaction.items.map((item, index) => (
                        <tr key={`${item.productId}-${index}`} className="hover:bg-[var(--color-secondary)]/10">
                          <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-[var(--text-muted)]">
                            {item.qty}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-[var(--text-muted)]">
                            {currency(item.price)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-[var(--foreground)]">
                            {currency(item.price * item.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h3 className="font-semibold text-[var(--foreground)] mb-3">Ringkasan Pembayaran</h3>
                <div className="space-y-2 bg-[var(--color-secondary)]/20 rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Subtotal</span>
                    <span className="font-medium text-[var(--foreground)]">{currency(transaction.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Total</span>
                    <span className="font-medium text-[var(--foreground)]">{currency(transaction.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Tunai Dibayar</span>
                    <span className="font-medium text-[var(--foreground)]">{currency(transaction.paid)}</span>
                  </div>
                  <div className="border-t border-[var(--card-border)] pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[var(--foreground)]">Kembalian</span>
                      <span className={`font-bold text-lg ${transaction.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {currency(transaction.change)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt Info */}
              {transaction.hasReceipt && (
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-3">Informasi Struk</h3>
                  <div className="bg-[var(--color-primary)]/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[var(--color-primary)]">
                      <FileText size={16} />
                      <span className="text-sm font-medium">Struk telah dibuat</span>
                    </div>
                    {transaction.receiptGeneratedAt && (
                      <p className="text-xs text-[var(--color-primary)]/80 mt-1">
                        Dibuat: {formatDateTime(transaction.receiptGeneratedAt)}
                      </p>
                    )}
                    {transaction.receiptDownloadUrl && (
                      <a
                        href={transaction.receiptDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 mt-1 inline-block"
                      >
                        Download struk →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-[var(--card-border)] bg-[var(--color-secondary)]/20">
            <button
              onClick={() => onShareWhatsApp(transaction)}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              Share WhatsApp
            </button>
            <button
              onClick={() => onGenerateReceipt(transaction)}
              className="flex-1 px-4 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Cetak Struk
            </button>
          </div>
        </div>
      </div>
    </>
  );
}