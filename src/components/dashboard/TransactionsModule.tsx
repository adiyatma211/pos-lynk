import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type { Category, Product, StockLog, Transaction, TransactionItem } from "@/types/pos";

interface TransactionsModuleProps {
  categories: Category[];
  transactionSearch: string;
  setTransactionSearch: Dispatch<SetStateAction<string>>;
  matchingProducts: Product[];
  handleAddToCart: (productId: string) => void;
  cart: TransactionItem[];
  products: Product[];
  updateCartQty: (productId: string, qty: number) => void;
  removeCartItem: (productId: string) => void;
  cartSubtotal: number;
  cash: string;
  setCash: Dispatch<SetStateAction<string>>;
  change: number;
  handleSaveTransaction: () => void;
  stockLogs: StockLog[];
  productNameById: (id: string) => string;
  formatDateTime: (value: string) => string;
  selectedTransaction: Transaction | null;
  handleGenerateReceipt: (transaction: Transaction) => void;
  handleShareWhatsApp: (transaction: Transaction) => void;
  currency: (value: number) => string;
  transactionCategoryFilter: string;
  setTransactionCategoryFilter: Dispatch<SetStateAction<string>>;
  isSavingTransaction: boolean;
}

export function TransactionsModule({
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
  handleSaveTransaction,
  stockLogs,
  productNameById,
  formatDateTime,
  selectedTransaction,
  handleGenerateReceipt,
  handleShareWhatsApp,
  currency,
  transactionCategoryFilter,
  setTransactionCategoryFilter,
  isSavingTransaction,
}: TransactionsModuleProps) {
  const [categoryPage, setCategoryPage] = useState(1);
  const pageSize = 4;

  const categoryStats = useMemo(() => {
    return categories.map((category) => {
      const groupedProducts = products.filter((product) => product.categoryId === category.id);
      return {
        id: category.id,
        name: category.name,
        products: groupedProducts,
      };
    });
  }, [categories, products]);

  const totalPages = Math.max(1, Math.ceil(categoryStats.length / pageSize));
  const safeCategoryPage = Math.min(categoryPage, totalPages);
  const startIndex = (safeCategoryPage - 1) * pageSize;
  const currentPageItems = categoryStats.slice(startIndex, startIndex + pageSize);

  const changeCategoryPage = (next: number) => {
    setCategoryPage(Math.min(Math.max(1, next), totalPages));
  };

  return (
    <section className="flex flex-col gap-6 lg:flex lg:flex-row lg:gap-6">
      <div className="space-y-6">
        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-8 shadow-lg shadow-[#5e8c520a] min-h-[250px] lg:min-h-[300px] lg:p-10">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Langkah 1</p>
            <h2 className="text-3xl font-semibold text-[var(--foreground)]">Pilih Produk</h2>
            <p className="text-base text-[var(--text-muted)]">Pilih kategori terlebih dahulu lalu cari produk yang ingin ditambahkan.</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-muted)]">Filter kategori</label>
              <select
                className="rounded-xl border border-[var(--card-border)] bg-white/85 px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
                value={transactionCategoryFilter}
                onChange={(event) => setTransactionCategoryFilter(event.target.value)}
              >
                <option value="all">Semua kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[var(--text-muted)]">Cari produk</label>
              <input
                type="search"
                placeholder="Cari produk untuk ditambahkan"
                className="rounded-xl border border-[var(--card-border)] bg-white/85 px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
                value={transactionSearch}
                onChange={(event) => setTransactionSearch(event.target.value)}
              />
            </div>
          </div>

          {transactionSearch && (
            <div className="mt-4 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-secondary)]/25 p-4 text-base text-[var(--text-muted)]">
              <p className="text-sm uppercase tracking-wide text-[var(--color-primary)]">Hasil pencarian</p>
              {matchingProducts.length === 0 && <p className="mt-2 text-[var(--text-muted)]">Tidak ada produk yang cocok.</p>}
              <div className="mt-3 grid gap-3">
                {matchingProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex items-center justify-between rounded-xl bg-white/95 px-4 py-3 text-left shadow-sm transition hover:shadow-md"
                    onClick={() => handleAddToCart(product.id)}
                  >
                    <span>
                      {product.name}
                      <span className="ml-2 text-sm text-[color:rgba(95,109,82,0.7)]">Stok {product.stock}</span>
                    </span>
                    <span className="text-base font-semibold text-[var(--foreground)]">{currency(product.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {currentPageItems.length === 0 && <p className="text-base text-[var(--text-muted)]">Belum ada kategori.</p>}
            {currentPageItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--card-border)] bg-[var(--color-secondary)]/20 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-[var(--foreground)]">{item.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">{item.products.length} produk</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--card-border)] px-3 py-1 text-sm"
                    onClick={() => setTransactionCategoryFilter(item.id)}
                  >
                    Pilih
                  </button>
                </div>
                {item.products.length === 0 ? (
                  <p className="mt-2 text-sm text-[color:rgba(95,109,82,0.7)]">Belum ada produk dalam kategori ini.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.products.slice(0, 4).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="rounded-full border border-[var(--card-border)] px-3 py-1 text-sm text-[var(--text-muted)] hover:border-[var(--color-primary)]"
                        onClick={() => handleAddToCart(product.id)}
                      >
                        {product.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <button
                type="button"
                className="rounded-full border border-[var(--card-border)] px-2 py-1"
                onClick={() => changeCategoryPage(safeCategoryPage - 1)}
                disabled={safeCategoryPage === 1}
              >
                Prev
              </button>
              <span>
                {safeCategoryPage}/{totalPages}
              </span>
              <button
                type="button"
                className="rounded-full border border-[var(--card-border)] px-2 py-1"
                onClick={() => changeCategoryPage(safeCategoryPage + 1)}
                disabled={safeCategoryPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-8 shadow-lg shadow-[#5e8c520a] min-h-[250px] lg:min-h-[300px] lg:p-10">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Langkah 2</p>
            <h2 className="text-3xl font-semibold text-[var(--foreground)]">Ringkasan Pesanan</h2>
            <p className="text-base text-[var(--text-muted)]">Atur qty, cek subtotal, lalu simpan transaksi.</p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-base">
              <thead>
                <tr className="text-[color:rgba(95,109,82,0.7)]">
                  <th className="px-2 py-2">Produk</th>
                  <th className="px-2 py-2">Harga</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2 text-right">Subtotal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-[color:rgba(95,109,82,0.7)]">
                      Keranjang kosong. Pilih produk terlebih dahulu.
                    </td>
                  </tr>
                )}
                {cart.map((item) => (
                  <tr key={item.productId} className="border-t border-[var(--card-border)]">
                    <td className="px-2 py-3 font-medium text-[var(--foreground)]">{item.name}</td>
                    <td className="px-2 py-3">{currency(item.price)}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-[var(--color-secondary)]/35 px-2 text-lg"
                          onClick={() => updateCartQty(item.productId, Math.max(1, item.qty - 1))}
                          disabled={item.qty === 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="w-16 rounded-xl border border-[var(--card-border)] bg-white/85 px-2 py-1 text-center focus:border-[var(--color-primary)] focus:outline-none"
                          value={item.qty}
                          onChange={(event) => updateCartQty(item.productId, Number(event.target.value) || 1)}
                        />
                        <button
                          type="button"
                          className="rounded-full bg-[var(--color-primary)] px-2 text-lg text-white"
                          onClick={() => updateCartQty(item.productId, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm text-[color:rgba(95,109,82,0.7)]">
                        Maks {products.find((product) => product.id === item.productId)?.stock ?? 0}
                      </p>
                    </td>
                    <td className="px-2 py-3 text-right font-semibold">{currency(item.price * item.qty)}</td>
                    <td className="px-2 py-3 text-right">
                      <button type="button" className="text-base text-red-500" onClick={() => removeCartItem(item.productId)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--color-secondary)]/25 px-4 py-4 text-base shadow-inner shadow-[#5e8c520f]">
            <div className="flex items-center justify-between">
              <p>Subtotal</p>
              <p className="text-lg font-semibold">{currency(cartSubtotal)}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-base text-[var(--text-muted)]" htmlFor="cash">
                Tunai
              </label>
              <input
                id="cash"
                type="number"
                className="flex-1 rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
                value={cash}
                onChange={(event) => setCash(event.target.value)}
              />
              <div className="text-right">
                <p className="text-sm text-[color:rgba(95,109,82,0.7)]">Kembalian</p>
                <p className={`text-lg font-semibold ${change < 0 ? "text-red-500" : "text-[var(--color-primary)]"}`}>
                  {currency(Math.max(change, 0))}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2 text-base font-semibold text-white shadow-lg shadow-[#5e8c520f] transition hover:bg-[#4f7846] disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleSaveTransaction}
              disabled={isSavingTransaction}
            >
              {isSavingTransaction ? "Menyimpan..." : "Simpan & Cetak Struk"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-8 shadow-lg shadow-[#5e8c520a] min-h-[250px] lg:min-h-[300px] lg:p-10">
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">Riwayat Stok</h2>
          <p className="text-base text-[var(--text-muted)]">Perubahan stok otomatis dicatat.</p>
          <div className="mt-4 space-y-3">
            {stockLogs.length === 0 && <p className="text-base text-[var(--text-muted)]">Belum ada perubahan stok.</p>}
            {stockLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--color-secondary)]/20 px-3 py-2 text-base">
                <p className="font-medium text-[var(--foreground)]">{productNameById(log.productId)}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {log.note} • {formatDateTime(log.createdAt)}
                </p>
                <p className={`text-base font-semibold ${log.type === "out" ? "text-red-500" : "text-[var(--color-primary)]"}`}>
                  {log.type === "out" ? "-" : "+"}
                  {log.amount} pcs
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-8 shadow-lg shadow-[#5e8c520a] min-h-[250px] lg:min-h-[300px] lg:p-10">
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">Detail Transaksi</h2>
          {!selectedTransaction && <p className="mt-2 text-base text-[var(--text-muted)]">Pilih transaksi untuk melihat detail.</p>}
          {selectedTransaction && (
            <div className="mt-3 space-y-3 text-base">
              <div>
                <p className="text-[var(--text-muted)]">ID Transaksi</p>
                <p className="font-semibold">{selectedTransaction.id}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)]">Tanggal</p>
                <p className="font-semibold">{formatDateTime(selectedTransaction.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-[var(--color-secondary)]/20 p-3">
                {selectedTransaction.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-base">
                    <p>
                      {item.name} x{item.qty}
                    </p>
                    <p className="font-medium">{currency(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
              <div>
                <p>Total Belanja</p>
                <p className="text-3xl font-semibold">{currency(selectedTransaction.total)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-[var(--card-border)] px-3 py-2 font-semibold"
                  onClick={() => handleGenerateReceipt(selectedTransaction)}
                >
                  Unduh PDF
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-green-600 px-3 py-2 font-semibold text-white"
                  onClick={() => handleShareWhatsApp(selectedTransaction)}
                >
                  Bagikan WA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}












