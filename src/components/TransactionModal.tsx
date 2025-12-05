import type { Transaction } from '@/types/pos';
import { currency, formatDateTime } from '@/utils/formatHelpers';

interface TransactionModalProps {
  transaction: Transaction;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransactionModal({ transaction, onConfirm, onCancel }: TransactionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Konfirmasi Transaksi</h3>

        <div className="space-y-3 mb-6">
          <div>
            <p className="text-sm text-gray-600">ID Transaksi</p>
            <p className="font-medium">{transaction.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tanggal</p>
            <p className="font-medium">{formatDateTime(transaction.createdAt)}</p>
          </div>

          <div className="border-t pt-3">
            <h4 className="font-medium mb-2">Detail Produk:</h4>
            <div className="space-y-2">
              {transaction.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>
                    {item.name} x{item.qty}
                  </span>
                  <span className="font-medium">{currency(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currency(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tunai</span>
              <span>{currency(transaction.paid)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Kembalian</span>
              <span className={transaction.change >= 0 ? "text-green-600" : "text-red-600"}>
                {currency(transaction.change)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={onCancel}
          >
            Batal
          </button>
          <button
            type="button"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={onConfirm}
          >
            Simpan & Cetak
          </button>
        </div>
      </div>
    </div>
  );
}