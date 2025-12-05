import React, { useState, useMemo } from 'react';
import { Search, Receipt, FileText, Share, User, Calendar, DollarSign, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/types/pos';
import { currency } from '@/utils/formatHelpers';

interface ReceiptsModuleProps {
  transactions: Transaction[];
  formatDateTime: (value: string) => string;
  handleGenerateReceipt: (transaction: Transaction) => void;
  handleShareWhatsApp: (transaction: Transaction) => void;
}

export function ReceiptsModule({
  transactions,
  formatDateTime,
  handleGenerateReceipt,
  handleShareWhatsApp,
}: ReceiptsModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Hardcoded cashier info
  const cashierInfo = {
    name: "Admin Kasir",
    id: "KSR001"
  };

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;

    const searchLower = searchTerm.toLowerCase();
    return transactions.filter(transaction =>
      transaction.id.toLowerCase().includes(searchLower) ||
      transaction.items.some(item => item.name.toLowerCase().includes(searchLower)) ||
      formatDateTime(transaction.createdAt).toLowerCase().includes(searchLower)
    );
  }, [transactions, searchTerm, formatDateTime]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Left Column - Receipts List */}
        <div className="flex flex-col h-full">
          <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 shadow-lg shadow-[#5e8c520a] overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-strong)] text-white p-3 flex-shrink-0">
              <div className="flex items-center mb-1">
                <Receipt className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-bold">Daftar Transaksi</h2>
              </div>
              <p className="text-white/70 text-sm">Riwayat semua transaksi</p>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-[var(--card-border)] flex-shrink-0">
              <div className="relative">
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                  🔍 Cari Transaksi
                </label>
                <input
                  type="search"
                  placeholder="ID transaksi, nama produk, atau tanggal..."
                  className="w-full rounded-lg border border-[var(--card-border)] bg-white/85 px-3 py-2 pr-9 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <div className="absolute right-2 top-8 text-[var(--text-muted)]">
                  <Search className="w-4 h-4" />
                </div>
              </div>

              {searchTerm && (
                <div className="mt-2 bg-[var(--color-secondary-soft)]/50 border border-[var(--color-primary)]/30 rounded-lg p-2">
                  <p className="text-xs text-[var(--color-primary-strong)] flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {filteredTransactions.length} transaksi ditemukan
                  </p>
                </div>
              )}
            </div>

            {/* Receipts List */}
            <div className="flex-1 overflow-y-auto p-3">
              {currentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-[var(--color-secondary-soft)]/50 rounded-full flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                    {searchTerm ? 'Tidak Ada Hasil' : 'Belum Ada Transaksi'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Mulai transaksi untuk melihat nota'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => setSelectedReceipt(transaction)}
                      className={`group rounded-xl border-2 bg-white/60 p-3 cursor-pointer transition-all hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 ${
                        selectedReceipt?.id === transaction.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-[var(--card-border)]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[var(--color-primary)] text-sm truncate">
                            {transaction.id}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatDateTime(transaction.createdAt)}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-[var(--color-primary)]">
                          {currency(transaction.total)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-secondary)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                            <User className="w-3 h-3 mr-1" />
                            {cashierInfo.name}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {transaction.items.length} item
                          </span>
                        </div>
                        <svg className="w-4 h-4 text-[var(--color-primary)] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-[var(--color-secondary-soft)]/30 rounded-xl border border-[var(--card-border)]">
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-white border border-[var(--card-border)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-[var(--color-primary)] text-white shadow-sm'
                            : 'bg-white text-[var(--text-muted)] hover:bg-[var(--color-secondary-soft)]/50 border border-[var(--card-border)]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-white border border-[var(--card-border)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Receipt Details */}
        <div className="flex flex-col h-full">
          <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 shadow-lg shadow-[#5e8c520a] overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="text-white p-3 flex-shrink-0" style={{background: 'linear-gradient(to right, #5E8C52, #4a6f41)'}}>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                <h2 className="text-sm font-bold">Detail Nota</h2>
              </div>
              <p className="text-white/70 text-xs">Informasi lengkap transaksi</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {!selectedReceipt ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-[var(--color-secondary-soft)]/50 rounded-full flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">Pilih transaksi untuk melihat detail</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Transaction Info */}
                  <div className="bg-[var(--color-secondary-soft)]/20 rounded-xl p-4 space-y-3 border border-[var(--card-border)]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">ID Transaksi</span>
                      <span className="font-bold text-[var(--color-primary)]">{selectedReceipt.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Tanggal & Waktu</span>
                      <span className="font-semibold text-[var(--foreground)] text-sm">
                        {formatDateTime(selectedReceipt.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Kasir</span>
                      <span className="font-semibold text-[var(--foreground)] text-sm">
                        {cashierInfo.name} ({cashierInfo.id})
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">Detail Produk</p>
                    <div className="bg-[var(--color-secondary-soft)]/20 rounded-xl p-4 space-y-2 border border-[var(--card-border)]">
                      {selectedReceipt.items.map((item) => (
                        <div key={item.productId} className="flex justify-between items-start text-sm">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="font-medium text-[var(--foreground)]">{item.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {currency(item.price)} × {item.qty}
                            </p>
                          </div>
                          <span className="font-bold text-[var(--color-primary)]">
                            {currency(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="border-t border-[var(--card-border)] pt-3">
                    <div className="bg-[var(--color-secondary-soft)]/20 rounded-xl p-4 space-y-2 border border-[var(--card-border)]">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--text-muted)]">Total Belanja</span>
                        <span className="font-bold text-[var(--foreground)]">{currency(selectedReceipt.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--text-muted)]">Tunai Dibayar</span>
                        <span className="font-bold text-[var(--foreground)]">{currency(selectedReceipt.paid)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--text-muted)]">Kembalian</span>
                        <span className="font-bold text-[var(--color-primary)]">{currency(selectedReceipt.change)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 px-4 py-3 rounded-xl font-medium transition-colors text-sm border border-[var(--color-primary)]/30"
                      onClick={() => handleGenerateReceipt(selectedReceipt)}
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Cetak Nota
                    </button>
                    <button
                      className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors text-sm border"
                      style={{backgroundColor: '#5E8C52', color: 'white', borderColor: '#5E8C52'}}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4a6f41';
                        e.currentTarget.style.borderColor = '#4a6f41';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#5E8C52';
                        e.currentTarget.style.borderColor = '#5E8C52';
                      }}
                      onClick={() => handleShareWhatsApp(selectedReceipt)}
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}