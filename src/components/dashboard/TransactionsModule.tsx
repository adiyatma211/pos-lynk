import React, { type Dispatch, SetStateAction } from "react";
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
  currency: (value: number) => string;
  transactionCategoryFilter: string;
  setTransactionCategoryFilter: Dispatch<SetStateAction<string>>;
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
  currency,
  transactionCategoryFilter,
  setTransactionCategoryFilter,
}: TransactionsModuleProps) {
  const [categoryPage, setCategoryPage] = useState(1);
  const [cartPage, setCartPage] = useState(1);
  const categoryPageSize = 2;
  const cartPageSize = 3;

  // Filter dan pagination logic
  const filteredCategoryStats = useMemo(() => {
    const currentCategory = categories.find(cat => cat.id === transactionCategoryFilter);

    if (transactionCategoryFilter === "all" || !currentCategory) {
      return categories
        .filter((category) => {
          return matchingProducts.some((product) => product.categoryId === category.id);
        })
        .map((category) => ({
          id: category.id,
          name: category.name,
          products: matchingProducts.filter((product) => product.categoryId === category.id),
        }));
    } else {
      const categoryProducts = matchingProducts.filter((product) => product.categoryId === currentCategory.id);
      return [{
        id: currentCategory.id,
        name: currentCategory.name,
        products: categoryProducts,
      }];
    }
  }, [categories, matchingProducts, transactionCategoryFilter]);

  const categoryTotalPages = Math.max(1, Math.ceil(filteredCategoryStats.length / categoryPageSize));
  const safeCategoryPage = Math.min(categoryPage, categoryTotalPages);
  const categoryStartIndex = (safeCategoryPage - 1) * categoryPageSize;
  const currentPageCategories = filteredCategoryStats.slice(categoryStartIndex, categoryStartIndex + categoryPageSize);

  const changeCategoryPage = (next: number) => {
    setCategoryPage(Math.min(Math.max(1, next), categoryTotalPages));
  };

  
  // Cart pagination
  const cartTotalPages = Math.max(1, Math.ceil(cart.length / cartPageSize));
  const safeCartPage = Math.min(cartPage, cartTotalPages);
  const cartStartIndex = (safeCartPage - 1) * cartPageSize;
  const currentPageCartItems = cart.slice(cartStartIndex, cartStartIndex + cartPageSize);

  const changeCartPage = (next: number) => {
    setCartPage(Math.min(Math.max(1, next), cartTotalPages));
  };

  
  // Reset cart page when cart changes
  React.useEffect(() => {
    setCartPage(1);
  }, [cart.length]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden grid gap-3 lg:grid-cols-[1.5fr_0.8fr] mb-2">
        {/* Left Column - Product Selection */}
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 shadow-lg shadow-[#5e8c520a] overflow-hidden flex flex-col h-full">
            {/* Product Selection Header */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-strong)] text-white p-2 flex-shrink-0">
              <div className="flex items-center mb-0.5">
                <span className="bg-white/20 rounded-full px-1 py-0.5 text-xs font-semibold mr-1.5">Langkah 1</span>
                <h2 className="text-base font-bold">Pilih Produk</h2>
              </div>
              <p className="text-white/70 text-xs">Cari dan pilih produk</p>
            </div>

            {/* Search and Filter */}
            <div className="p-2.5 border-b border-[var(--card-border)] flex-shrink-0">
              <div className="grid gap-1.5 md:grid-cols-2">
                <div className="relative">
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    🏷️ Kategori
                  </label>
                  <select
                    className="w-full rounded-lg border border-[var(--card-border)] bg-white/85 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all"
                    value={transactionCategoryFilter}
                    onChange={(event) => {
                      console.log('[TransactionsModule] Category filter changed:', {
                        oldValue: transactionCategoryFilter,
                        newValue: event.target.value
                      });
                      setTransactionCategoryFilter(event.target.value);
                    }}
                  >
                    <option value="all">📋 Semua Kategori</option>
                    {categories
                      .filter((category) => {
                        return products.some((product) => product.categoryId === category.id);
                      })
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    🔍 Cari Produk
                  </label>
                  <input
                    type="search"
                    placeholder="Ketik nama produk..."
                    className="w-full rounded-lg border border-[var(--card-border)] bg-white/85 px-3 py-2 pr-9 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all"
                    value={transactionSearch}
                    onChange={(event) => setTransactionSearch(event.target.value)}
                  />
                  <div className="absolute right-2 top-7 text-[var(--text-muted)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {transactionSearch && (
                <div className="mt-3 bg-[var(--color-secondary-soft)]/50 border border-[var(--color-primary)]/30 rounded-lg p-2">
                  <p className="text-xs text-[var(--color-primary-strong)] flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {matchingProducts.length} hasil
                  </p>
                </div>
              )}
            </div>

            {/* Products List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-2.5">
              {currentPageCategories.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-[var(--color-secondary-soft)]/50 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">Tidak Ada Produk</h3>
                  <p className="text-xs text-[var(--text-muted)]">Coba ubah filter kategori</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentPageCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="sticky top-0 z-10 bg-gradient-to-r from-[var(--color-secondary)]/20 to-[var(--color-secondary-soft)]/30 rounded-lg p-2 backdrop-blur border border-[var(--card-border)]">
                        <h3 className="font-semibold text-[var(--foreground)] flex items-center">
                          <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded px-1.5 py-0.5 text-xs font-semibold mr-2">
                            {category.name}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">{category.products.length} produk</span>
                        </h3>
                      </div>
                      <div className="grid gap-2">
                        {category.products.map((product) => {
                          const inCart = cart.find((item) => item.productId === product.id);
                          const cartQty = inCart?.qty || 0;
                          const remainingStock = product.stock - cartQty;
                          const isOutOfStock = product.stock <= 0;

                          return (
                            <div
                              key={product.id}
                              className={`group flex items-center justify-between rounded-lg border-2 bg-white/60 p-3 transition-all hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 ${
                                isOutOfStock ? 'opacity-60 border-gray-300' : 'border-[var(--card-border)]'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-[var(--foreground)] text-sm truncate">{product.name}</h4>
                                <p className="text-lg font-bold text-[var(--color-primary)]">{currency(product.price)}</p>
                                <div className="flex items-center mt-1">
                                  {remainingStock > 0 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{backgroundColor: '#A1B986', color: '#5E8C52'}}>
                                      ✅ {remainingStock} pcs
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      ❌ Habis
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {inCart ? (
                                  <div className="flex items-center bg-[var(--color-primary)]/10 rounded-lg px-1.5 py-0.5 border border-[var(--color-primary)]/20">
                                    <button
                                      type="button"
                                      className="w-6 h-6 rounded bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-strong)] transition-colors"
                                      onClick={() => updateCartQty(product.id, Math.max(1, cartQty - 1))}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                      </svg>
                                    </button>
                                    <span className="mx-2 min-w-[2rem] text-center font-bold text-[var(--color-primary)]">
                                      {cartQty}
                                    </span>
                                    <button
                                      type="button"
                                      className="w-6 h-6 rounded bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-strong)] transition-colors"
                                      onClick={() => updateCartQty(product.id, Math.min(product.stock, cartQty + 1))}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-strong)] text-white px-3 py-1.5 rounded-lg font-semibold transition-all hover:shadow-lg active:scale-95 flex items-center gap-1 text-sm border-2 border-transparent hover:border-[var(--color-primary-strong)]"
                                    onClick={() => handleAddToCart(product.id)}
                                    disabled={isOutOfStock}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Tambah
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category Pagination */}
              {categoryTotalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2 p-3 bg-[var(--color-secondary-soft)]/30 rounded-lg border border-[var(--card-border)]">
                  <button
                    type="button"
                    className="w-6 h-6 rounded bg-white border border-[var(--card-border)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={safeCategoryPage === 1}
                    onClick={() => changeCategoryPage(safeCategoryPage - 1)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: categoryTotalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => changeCategoryPage(page)}
                        className={`w-6 h-6 rounded text-xs font-medium transition-all duration-200 ${
                          safeCategoryPage === page
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
                    className="w-6 h-6 rounded bg-white border border-[var(--card-border)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={safeCategoryPage === categoryTotalPages}
                    onClick={() => changeCategoryPage(safeCategoryPage + 1)}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column - Cart */}
        <div className="flex flex-col h-full space-y-4">
          {/* Cart Summary */}
          <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 shadow-lg shadow-[#5e8c520a] overflow-hidden flex flex-col h-full">
            <div className="text-white p-2 flex-shrink-0" style={{background: 'linear-gradient(to right, #5E8C52, #4a6f41)'}}>
              <div className="flex items-center mb-0.5">
                <span className="bg-white/20 rounded-full px-1 py-0.5 text-xs font-semibold mr-1.5">Langkah 2</span>
                <h2 className="text-sm font-bold">Keranjang</h2>
              </div>
              <p className="text-white/70 text-xs">Periksa dan hitung total</p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col p-2.5">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-[var(--color-secondary-soft)]/50 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Keranjang Kosong</h3>
                    <p className="text-xs text-[var(--text-muted)]">Tambah produk untuk memulai</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {currentPageCartItems.map((item) => (
                      <div key={item.productId} className="bg-[var(--color-secondary-soft)]/20 rounded-md p-2 border border-[var(--card-border)]">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1 flex-1 mr-2">
                            <h4 className="font-semibold text-[var(--foreground)] truncate text-xs">{item.name}</h4>
                            <p className="text-xs text-[var(--text-muted)]">{currency(item.price)} × {item.qty}</p>
                          </div>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                            onClick={() => removeCartItem(item.productId)}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="w-5 h-5 rounded bg-[var(--color-secondary)]/35 hover:bg-[var(--color-secondary)]/50 flex items-center justify-center transition-colors"
                              onClick={() => updateCartQty(item.productId, Math.max(1, item.qty - 1))}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center font-bold text-[var(--foreground)] text-sm">{item.qty}</span>
                            <button
                              type="button"
                              className="w-5 h-5 rounded bg-[var(--color-secondary)]/35 hover:bg-[var(--color-secondary)]/50 flex items-center justify-center transition-colors"
                              onClick={() => updateCartQty(item.productId, item.qty + 1)}
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <span className="font-bold text-sm text-[var(--color-primary)]">
                            {currency(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Pagination */}
                  {cartTotalPages > 1 && (
                    <div className="mb-3 flex items-center justify-center gap-1 p-2 bg-[var(--color-secondary-soft)]/20 rounded-md border border-[var(--card-border)]">
                      <button
                        type="button"
                        className="w-5 h-5 rounded bg-white border border-[var(--card-border)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        disabled={safeCartPage === 1}
                        onClick={() => changeCartPage(safeCartPage - 1)}
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: cartTotalPages }, (_, index) => index + 1).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => changeCartPage(page)}
                            className={`w-5 h-5 rounded text-xs font-medium transition-all duration-200 ${
                              safeCartPage === page
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'bg-white text-[var(--text-muted)] hover:bg-[var(--color-secondary-soft)]/50 border border-[var(--card-border)]'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="w-5 h-5 rounded bg-white border border-[var(--card-border)] text-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        disabled={safeCartPage === cartTotalPages}
                        onClick={() => changeCartPage(safeCartPage + 1)}
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="flex-shrink-0 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">Total:</span>
                      <span className="text-lg font-bold text-[var(--foreground)]">{currency(cartSubtotal)}</span>
                    </div>

                    <div className="bg-[var(--color-secondary)]/30 rounded-lg p-3 border border-[var(--card-border)]">
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                        💵 Uang Tunai
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full rounded-md border-0 bg-white/70 px-3 py-2 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                        value={cash}
                        onChange={(event) => setCash(event.target.value)}
                      />
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-[var(--text-muted)]">Kembalian:</span>
                        <span className={`text-sm font-semibold ${change < 0 ? "text-red-500" : "text-[var(--color-primary)]"}`}>
                          {currency(Math.max(change, 0))}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                        cart.length > 0 && cash && parseFloat(cash) >= cartSubtotal
                          ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-strong)] text-white shadow-md hover:shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      onClick={handleSaveTransaction}
                      disabled={cart.length === 0 || !cash || parseFloat(cash) < cartSubtotal}
                    >
                      💾 Simpan & Cetak
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}