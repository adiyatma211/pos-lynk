/* eslint-disable @next/next/no-img-element */
import type { Dispatch, SetStateAction } from "react";
import type { Category, Product } from "@/types/pos";

interface ProductsModuleProps {
  categories: Category[];
  filteredProducts: Product[];
  productFilter: string;
  productSearch: string;
  productForm: {
    name: string;
    price: string;
    categoryId: string;
    stock: string;
    photo: string;
  };
  editingProductId: string | null;
  categoryForm: { name: string };
  editingCategoryId: string | null;
  isLoading?: boolean;
  error?: string;
  setProductFilter: Dispatch<SetStateAction<string>>;
  setProductSearch: Dispatch<SetStateAction<string>>;
  setProductForm: Dispatch<
    SetStateAction<{
      name: string;
      price: string;
      categoryId: string;
      stock: string;
      photo: string;
    }>
  >;
  setCategoryForm: Dispatch<SetStateAction<{ name: string }>>;
  resetProductForm: () => void;
  resetCategoryForm: () => void;
  upsertProduct: () => void;
  handleEditProduct: (id: string) => void;
  handleDeleteProduct: (id: string) => void;
  upsertCategory: () => void;
  handleEditCategory: (id: string) => void;
  handleDeleteCategory: (id: string) => void;
  currency: (value: number) => string;
}

export function ProductsModule({
  categories,  // Use the original prop name
  filteredProducts,  // Use the original prop name
  productFilter,
  productSearch,
  productForm,
  editingProductId,
  categoryForm,
  editingCategoryId,
  isLoading = false,
  error,
  setProductFilter,
  setProductSearch,
  setProductForm,
  setCategoryForm,
  resetProductForm,
  resetCategoryForm,
  upsertProduct,
  handleEditProduct,
  handleDeleteProduct,
  upsertCategory,
  handleEditCategory,
  handleDeleteCategory,
  currency,
}: ProductsModuleProps) {
  // Defensive programming: ensure categories and filteredProducts are always arrays
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Filter products based on props - don't add fallback data
  const safeFilteredProducts = Array.isArray(filteredProducts) ? filteredProducts.filter((product) => {
    // Handle empty categoryId consistently with page.tsx
    const productCategoryId = product.categoryId || "";
    const matchCategory = productFilter === "all" || productCategoryId === productFilter;
    const matchSearch = productSearch === "" || product.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchCategory && matchSearch;
  }) : [];

  // Debug logging (remove in production)
  if (typeof window !== 'undefined') {
    console.log('ProductsModule Debug:', {
      productFilter,
      productSearch,
      totalProducts: filteredProducts?.length || 0,
      filteredCount: safeFilteredProducts.length,
      categoriesCount: safeCategories.length,
      sampleProduct: filteredProducts?.[0],
      categories: safeCategories.map(c => ({ id: c.id, name: c.name }))
    });
  }
  // Error display
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-red-800">❌ {error}</p>
          <p className="mt-1 text-xs text-red-600">Tidak dapat memuat data produk. Silakan coba lagi nanti.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-6 shadow-lg shadow-[#5e8c520a]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Produk</h2>
            <p className="text-sm text-[var(--text-muted)]">Tambah, edit, dan filter produk.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-xl border border-[var(--card-border)] bg-white/80 px-3 py-1.5 text-sm text-[var(--text-muted)] hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:outline-none cursor-pointer transition-colors"
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {safeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Cari produk"
              className="rounded-xl border border-[var(--card-border)] bg-white/80 px-3 py-1.5 text-sm"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {safeFilteredProducts.length === 0 && <p className="text-sm text-[var(--text-muted)]">Belum ada produk.</p>}
          {safeFilteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--color-secondary)]/20 p-3"
            >
              <div className="flex items-center gap-3">
                {product.photo ? (
                  <img src={product.photo} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-sm font-semibold text-[var(--color-primary)]">
                    {product.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{currency(product.price)}</p>
                  <p className="text-xs text-[color:rgba(95,109,82,0.75)]">
                    Stok: {product.stock} - {safeCategories.find((category) => category.id === product.categoryId)?.name ?? "-"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--card-border)] px-3 py-1 text-sm text-[var(--text-muted)] hover:border-[var(--color-primary)]"
                  onClick={() => handleEditProduct(product.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-600"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-6 shadow-lg shadow-[#5e8c520a]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                {editingProductId ? "Edit Produk" : "Produk Baru"}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">Nama, harga, kategori, stok, foto.</p>
            </div>
            {editingProductId && (
              <button type="button" className="text-sm font-semibold text-[var(--color-primary)]" onClick={resetProductForm}>
                Batalkan edit
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-3">
            <input
              type="text"
              placeholder="Nama produk"
              className="rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Harga jual"
                className="rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                value={productForm.price}
                onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
              />
              <input
                type="number"
                placeholder="Stok"
                className="rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                value={productForm.stock}
                onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
              />
            </div>
            <select
              className="rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              value={productForm.categoryId}
              onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              {safeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="url"
              placeholder="Link foto produk (opsional)"
              className="rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              value={productForm.photo}
              onChange={(event) => setProductForm((prev) => ({ ...prev, photo: event.target.value }))}
            />
            <button
              type="button"
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4f7846]"
              onClick={upsertProduct}
            >
              {editingProductId ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-6 shadow-lg shadow-[#5e8c520a]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                {editingCategoryId ? "Edit Kategori" : "Kategori"}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">Kelola kategori produk.</p>
            </div>
            {editingCategoryId && (
              <button type="button" className="text-sm font-semibold text-[var(--color-primary)]" onClick={resetCategoryForm}>
                Batalkan edit
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Nama kategori"
              className="flex-1 rounded-xl border border-[var(--card-border)] bg-white/85 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ name: event.target.value })}
            />
            <button
              type="button"
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4f7846]"
              onClick={upsertCategory}
            >
              {editingCategoryId ? "Simpan" : "Tambah"}
            </button>
          </div>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
            {safeCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--color-secondary)]/25 px-3 py-2 text-sm"
              >
                <p>{category.name}</p>
                <div className="flex gap-2">
                  <button type="button" className="font-semibold text-[var(--color-primary)]" onClick={() => handleEditCategory(category.id)}>
                    Edit
                  </button>
                  {safeCategories.length > 1 && (
                    <button type="button" className="text-red-500" onClick={() => handleDeleteCategory(category.id)}>
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
