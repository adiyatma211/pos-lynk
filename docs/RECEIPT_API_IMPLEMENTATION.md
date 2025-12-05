# Receipt API Implementation Guide

## Overview

Dokumen ini berisi implementasi sederhana untuk menampilkan semua nota di modul nota dengan pagination dan fitur klik untuk menampilkan detail nota.

## 1. Backend API Implementation

### 1.1 Enhanced TransactionController

Modifikasi `pos-be/app/Http/Controllers/Api/TransactionController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Product;
use App\Models\Receipt;
use App\Models\StockLog;
use App\Models\Transaction;
use App\Services\ReceiptPdfService;
use App\Services\SimplePdfService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    // ... existing code ...

    /**
     * Display a listing of the resource with receipt information.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        [$startDate, $endDate] = $this->resolveDateRange($request);

        $query = Transaction::query()
            ->with(['items', 'receipt']) // Always load receipt for status checking
            ->withCount('items')
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->when($request->input('search'), function ($q, $search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhereHas('items', function ($subQ) use ($search) {
                      $subQ->where('product_name', 'like', "%{$search}%");
                  });
            })
            ->latest();

        // Pagination
        $perPage = $request->integer('per_page', 10);
        $perPage = max(1, min($perPage, 100)); // Limit between 1-100

        $transactions = $query->paginate($perPage);

        return TransactionResource::collection($transactions);
    }

    /**
     * Display the specified resource with receipt information.
     */
    public function show(Transaction $transaction): TransactionResource
    {
        return new TransactionResource($transaction->load('items', 'receipt')->loadCount('items'));
    }

    // ... rest of existing code ...
}
```

### 1.2 Enhanced TransactionResource

Modifikasi `pos-be/app/Http/Resources/TransactionResource.php`:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'code' => $this->code,
            'referenceId' => $this->id,
            'subtotal' => $this->subtotal,
            'total' => $this->total,
            'paid' => $this->paid,
            'change' => $this->change,
            'itemCount' => $this->items_count ?? $this->items?->count(),
            'createdAt' => $this->created_at?->toISOString(),
            'items' => TransactionItemResource::collection($this->whenLoaded('items')),
            'receipt' => $this->whenLoaded('receipt', function () {
                return $this->receipt ? new ReceiptResource($this->receipt) : null;
            }),
            // New fields for receipt status
            'hasReceipt' => $this->whenLoaded('receipt', function () {
                return $this->receipt ? true : false;
            }),
            'receiptGeneratedAt' => $this->whenLoaded('receipt', function () {
                return $this->receipt?->generated_at?->toISOString();
            }),
            'receiptDownloadUrl' => $this->whenLoaded('receipt', function () {
                return $this->receipt ? route('receipts.download', $this->receipt->id) : null;
            }),
        ];
    }
}
```

### 1.3 Enhanced ReceiptResource

Modifikasi `pos-be/app/Http/Resources/ReceiptResource.php`:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReceiptResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_id' => $this->transaction_id,
            'filename' => $this->filename,
            'path' => $this->path,
            'url' => $this->url,
            'download_url' => $this->download_url,
            'file_size' => $this->file_size,
            'generated_at' => $this->generated_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include transaction data if loaded
            'transaction' => $this->whenLoaded('transaction', function () {
                return new TransactionResource($this->transaction);
            }),
            
            // Additional fields for easier frontend handling
            'file_size_formatted' => $this->when($this->file_size, function () {
                return $this->formatFileSize($this->file_size);
            }),
        ];
    }

    /**
     * Format file size for display
     */
    private function formatFileSize($bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
```

## 2. Frontend Implementation

### 2.1 Enhanced ReceiptsModule Component

Modifikasi `pos-lynk/src/components/dashboard/ReceiptsModule.tsx`:

```typescript
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Receipt, FileText, Share, User, Calendar, DollarSign, Package, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import type { Transaction } from '@/types/pos';
import { currency, formatDateTime } from '@/utils/formatHelpers';
import { useAPI } from '@/utils/config';
import apiClient from '@/services/api';

interface ReceiptsModuleProps {
  transactions: Transaction[];
  formatDateTime: (value: string) => string;
  handleGenerateReceipt: (transaction: Transaction) => void;
  handleShareWhatsApp: (transaction: Transaction) => void;
}

interface PaginatedTransactions {
  data: Transaction[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedTransactions | null>(null);
  const [perPage] = useState(10);
  const shouldUseAPI = useAPI();

  // Hardcoded cashier info
  const cashierInfo = {
    name: "Admin Kasir",
    id: "KSR001"
  };

  // Fetch transactions from API with pagination
  const fetchTransactions = async (page: number = 1, search: string = '') => {
    if (!shouldUseAPI) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (search.trim()) {
        params.append('search', search);
      }

      const response = await apiClient.get(`/transactions?${params}`);
      
      if (response.data) {
        setPaginatedTransactions(response.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and search
  useEffect(() => {
    if (shouldUseAPI) {
      fetchTransactions(currentPage, searchTerm);
    }
  }, [shouldUseAPI, currentPage]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (shouldUseAPI) {
        setCurrentPage(1);
        fetchTransactions(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, shouldUseAPI]);

  // Filter transactions for local mode
  const filteredTransactions = useMemo(() => {
    if (shouldUseAPI) {
      return paginatedTransactions?.data || [];
    }

    if (!searchTerm.trim()) return transactions;

    const searchLower = searchTerm.toLowerCase();
    return transactions.filter(transaction =>
      transaction.id.toLowerCase().includes(searchLower) ||
      transaction.items.some(item => item.name.toLowerCase().includes(searchLower)) ||
      formatDateTime(transaction.createdAt).toLowerCase().includes(searchLower)
    );
  }, [transactions, searchTerm, formatDateTime, shouldUseAPI, paginatedTransactions]);

  // Pagination for local mode
  const totalPages = useMemo(() => {
    if (shouldUseAPI) {
      return paginatedTransactions?.last_page || 1;
    }
    return Math.max(1, Math.ceil(filteredTransactions.length / perPage));
  }, [shouldUseAPI, paginatedTransactions, filteredTransactions, perPage]);

  const startIndex = useMemo(() => {
    if (shouldUseAPI) {
      return 0; // API already handles pagination
    }
    return (currentPage - 1) * perPage;
  }, [shouldUseAPI, currentPage, perPage]);

  const currentTransactions = useMemo(() => {
    if (shouldUseAPI) {
      return filteredTransactions;
    }
    return filteredTransactions.slice(startIndex, startIndex + perPage);
  }, [shouldUseAPI, filteredTransactions, startIndex, perPage]);

  const handlePageChange = (page: number) => {
    const newPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(newPage);
    
    if (shouldUseAPI) {
      fetchTransactions(newPage, searchTerm);
    }
  };

  const handleDownloadReceipt = async (transaction: Transaction) => {
    if (!transaction.hasReceipt || !transaction.receiptDownloadUrl) {
      handleGenerateReceipt(transaction);
      return;
    }

    try {
      const response = await apiClient.get(transaction.receiptDownloadUrl, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', transaction.receipt?.filename || `receipt-${transaction.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      // Fallback to generate new receipt
      handleGenerateReceipt(transaction);
    }
  };

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedReceipt(transaction);
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
                <h2 className="text-lg font-bold">Daftar Nota</h2>
              </div>
              <p className="text-white/70 text-sm">
                {shouldUseAPI 
                  ? `Total ${paginatedTransactions?.total || 0} transaksi`
                  : `Riwayat semua transaksi`
                }
              </p>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-[var(--card-border)] flex-shrink-0">
              <div className="relative">
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                  🔍 Cari Nota
                </label>
                <input
                  type="search"
                  placeholder="ID transaksi, nama produk, atau tanggal..."
                  className="w-full rounded-lg border border-[var(--card-border)] bg-white/85 px-3 py-2 pr-9 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!shouldUseAPI) {
                      setCurrentPage(1);
                    }
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
                    {shouldUseAPI 
                      ? `Menampilkan ${paginatedTransactions?.data?.length || 0} hasil`
                      : `${filteredTransactions.length} transaksi ditemukan`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Receipts List */}
            <div className="flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mx-auto mb-3"></div>
                  <p className="text-sm text-[var(--text-muted)]">Memuat data...</p>
                </div>
              ) : currentTransactions.length === 0 ? (
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
                      className={`group rounded-xl border-2 bg-white/60 p-3 cursor-pointer transition-all hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 ${
                        selectedReceipt?.id === transaction.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-[var(--card-border)]'
                      }`}
                      onClick={() => handleViewReceipt(transaction)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[var(--color-primary)] text-sm truncate">
                              {transaction.id}
                            </p>
                            {transaction.hasReceipt && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <Receipt className="w-3 h-3 mr-1" />
                                Ada Nota
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatDateTime(transaction.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[var(--color-primary)]">
                            {currency(transaction.total)}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            {transaction.hasReceipt && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadReceipt(transaction);
                                }}
                                className="p-1 rounded hover:bg-[var(--color-primary)]/10 transition-colors"
                                title="Download Nota"
                              >
                                <Download className="w-4 h-4 text-[var(--color-primary)]" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareWhatsApp(transaction);
                              }}
                              className="p-1 rounded hover:bg-[var(--color-primary)]/10 transition-colors"
                              title="Share WhatsApp"
                            >
                              <Share className="w-4 h-4 text-[var(--color-primary)]" />
                            </button>
                          </div>
                        </div>
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
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = index + 1;
                      } else if (currentPage <= 3) {
                        pageNum = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + index;
                      } else {
                        pageNum = currentPage - 2 + index;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isLoading}
                          className={`w-7 h-7 rounded-lg text-xs font-medium transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-[var(--color-primary)] text-white shadow-sm'
                              : 'bg-white text-[var(--text-muted)] hover:bg-[var(--color-secondary-soft)]/50 border border-[var(--card-border)]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-white border border-[var(--card-border)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                    disabled={currentPage === totalPages || isLoading}
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
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Status Nota</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedReceipt.hasReceipt 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {selectedReceipt.hasReceipt ? (
                          <>
                            <Receipt className="w-3 h-3 mr-1" />
                            Sudah Ada
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 mr-1" />
                            Belum Ada
                          </>
                        )}
                      </span>
                    </div>
                    {selectedReceipt.receiptGeneratedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Dibuat</span>
                        <span className="font-semibold text-[var(--foreground)] text-sm">
                          {formatDateTime(selectedReceipt.receiptGeneratedAt)}
                        </span>
                      </div>
                    )}
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
                      {selectedReceipt.hasReceipt ? 'Regenerasi Nota' : 'Buat Nota'}
                    </button>
                    {selectedReceipt.hasReceipt && (
                      <button
                        className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-3 rounded-xl font-medium transition-colors text-sm border border-blue-200"
                        onClick={() => handleDownloadReceipt(selectedReceipt)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    )}
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
                      Share
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
```

### 2.2 Update Container Components

Update `pos-lynk/src/containers/HomeContainer.tsx` dan `pos-lynk/src/containers/EnhancedHomeContainer.tsx` untuk menggunakan ReceiptsModule yang sudah diperbarui.

## 3. API Routes Update

Pastikan routes di `pos-be/routes/api.php` sudah mencakup:

```php
// Transaction routes
Route::apiResource('transactions', TransactionController::class)->only(['index', 'store', 'show']);

// Receipt routes
Route::prefix('receipts')->group(function () {
    Route::post('upload', [ReceiptController::class, 'upload']);
    Route::post('transactions/{transaction}', [ReceiptController::class, 'generate']);
    Route::get('transactions/{transaction}', [ReceiptController::class, 'getByTransaction']);
    Route::get('{receipt}/download', [ReceiptController::class, 'download'])->name('receipts.download');
    Route::delete('{receipt}', [ReceiptController::class, 'destroy']);
});
```

## 4. Features Summary

### ✅ Implemented Features:
1. **Display All Receipts** - Menampilkan semua transaksi dengan status nota
2. **Pagination** - Navigasi halaman untuk data yang banyak
3. **Search Functionality** - Pencarian berdasarkan ID, nama produk, atau tanggal
4. **Receipt Status Indicator** - Menunjukkan apakah nota sudah ada atau belum
5. **Click to View Details** - Klik transaksi untuk melihat detail lengkap
6. **Download Receipt** - Download nota yang sudah ada
7. **Generate Receipt** - Buat nota baru jika belum ada
8. **Share WhatsApp** - Bagikan transaksi via WhatsApp
9. **Responsive Design** - Tampilan yang baik di desktop dan mobile

### 🔧 Technical Implementation:
1. **API Integration** - Menggunakan API backend dengan pagination
2. **Local Fallback** - Bekerja dengan localStorage jika API tidak tersedia
3. **Loading States** - Indikator loading saat mengambil data
4. **Error Handling** - Penanganan error yang baik
5. **Performance** - Debounce untuk pencarian dan optimal rendering

## 5. Usage Instructions

1. **View All Receipts**: Buka modul nota untuk melihat semua transaksi
2. **Search**: Gunakan search bar untuk mencari transaksi spesifik
3. **Pagination**: Navigasi halaman jika data banyak
4. **View Details**: Klik transaksi untuk melihat detail lengkap
5. **Download**: Klik icon download untuk mengunduh nota yang sudah ada
6. **Generate**: Klik "Buat Nota" untuk membuat nota baru
7. **Share**: Klik "Share" untuk berbagi via WhatsApp

Implementasi ini menyediakan solusi sederhana namun lengkap untuk menampilkan dan mengelola nota di frontend dengan pagination dan fitur interaktif.