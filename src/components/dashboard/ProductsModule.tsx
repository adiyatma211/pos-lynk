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
    categoryId: number;
    stock: string;
    photo: string;
  };
  editingProductId: string | null;
  categoryForm: { name: string };
  editingCategoryId: number | null;
  setProductFilter: Dispatch<SetStateAction<string>>;
  setProductSearch: Dispatch<SetStateAction<string>>;
  setProductForm: Dispatch<
    SetStateAction<{
      name: string;
      price: string;
      categoryId: number;
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
  categories,
  filteredProducts,
  productFilter,
  productSearch,
  productForm,
  editingProductId,
  categoryForm,
  editingCategoryId,
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
  console.log('ProductsModule received categories:', categories);
  console.log('ProductsModule received categories length:', categories?.length);
  console.log('ProductsModule categories type:', typeof categories);
  console.log('ProductsModule categories constructor:', categories?.constructor?.name);
  
  // Debug rendering
  console.log('=== CATEGORIES RENDERING DEBUG ===');
  console.log('Categories value:', categories);
  console.log('JSON.stringify(categories):', JSON.stringify(categories));
  console.log('Array.isArray(categories):', Array.isArray(categories));
  
  if (categories && categories.length > 0) {
    console.log('Categories breakdown:', categories.map((cat, idx) => ({
      idx,
      id: cat.id,
      name: cat.name,
      nameType: typeof cat.name,
      isValid: cat.id && cat.name
    })));
  } else {
    console.log('No categories to render - categories:', categories, 'length:', categories?.length);
  }
  console.log('=== END DEBUG ===');
  return (
    <section className="flex flex-col gap-6 lg:flex lg:flex-row lg:gap-6">
      <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-8 shadow-lg shadow-[#5e8c520a] min-h-[200px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-[var(--foreground)]">Produk</h2>
            <p className="text-base text-[var(--text-muted)]">Tambah, edit, dan filter produk.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-xl border border-[var(--card-border)] bg-white/80 px-4 py-2.5 text-base text-[var(--text-muted)]"
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {Array.isArray(categories) && categories.map((category) => (
                <option key={category.id || category.name || `category-${category.name}`} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Cari produk"
              className="rounded-xl border border-[var(--card-border)] bg-white/80 px-4 py-2.5 text-base"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {filteredProducts.length === 0 && <p className="text-base text-[var(--text-muted)]">Belum ada produk.</p>}
          {filteredProducts.map((product) => (
            <div
              key={product.id || product.name || `product-${product.name}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--color-secondary)]/20 p-3"
            >
              <div className="flex items-center gap-3">
                {product.photo ? (
                  <img src={product.photo} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-base font-semibold text-[var(--color-primary)]">
                    {product.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                  <p className="text-base text-[var(--text-muted)]">{currency(product.price)}</p>
                  <p className="text-sm text-[color:rgba(95,109,82,0.75)]">
                    Stok: {product.stock} - {categories.find((category) => category.id === product.categoryId)?.name ?? "-"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--card-border)] px-4 py-2 text-base text-[var(--text-muted)] hover:border-[var(--color-primary)]"
                  onClick={() => handleEditProduct(product.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-base text-red-600"
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
        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-8 shadow-lg shadow-[#5e8c520a] min-h-[200px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--foreground)]">
                {editingProductId ? "Edit Produk" : "Produk Baru"}
              </h2>
              <p className="text-base text-[var(--text-muted)]">Nama, harga, kategori, stok, foto.</p>
            </div>
            {editingProductId && (
              <button type="button" className="text-base font-semibold text-[var(--color-primary)]" onClick={resetProductForm}>
                Batalkan edit
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-3">
            <input
              type="text"
              placeholder="Nama produk"
              className="rounded-xl border border-[var(--card-border)] bg-white/85 px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Harga jual"
                className="rounded-xl border border-[var(--card-border)] bg-white/85 px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
                value={productForm.price}
                onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
              />
              <input
                type="number"
                placeholder="Stok"
                className="rounded-xl border border-[var(--card-border)] bg-white/85 px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
                value={productForm.stock}
                onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
              />
            </div>
            <select
              className="rounded-xl border border-[var(--card-border)] bg-white/85 px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
              value={productForm.categoryId}
              onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              {Array.isArray(categories) && categories.map((category) => (
                <option key={category.id || category.name || `category-${category.name}`} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="url"
              placeholder="Link foto produk (opsional)"
              className="rounded-xl border border-[var(--card-border)] bg-white/85 px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
              value={productForm.photo}
              onChange={(event) => setProductForm((prev) => ({ ...prev, photo: event.target.value }))}
            />
            <button
              type="button"
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-base font-semibold text-white shadow-sm transition hover:bg-[#4f7846]"
              onClick={upsertProduct}
            >
              {editingProductId ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--card-border)] bg-white/90 p-8 shadow-lg shadow-[#5e8c520a] min-h-[200px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--foreground)]">
                {editingCategoryId ? "Edit Kategori" : "Kategori"}
              </h2>
              <p className="text-base text-[var(--text-muted)]">Kelola kategori produk.</p>
            </div>
            {editingCategoryId && (
              <button type="button" className="text-base font-semibold text-[var(--color-primary)]" onClick={resetCategoryForm}>
                Batalkan edit
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Nama kategori"
              className="flex-1 rounded-xl border border-[var(--card-border)] bg-white/85 px-4 py-3 text-base focus:border-[var(--color-primary)] focus:outline-none"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ name: event.target.value })}
            />
            <button
              type="button"
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-base font-semibold text-white shadow-sm hover:bg-[#4f7846]"
              onClick={upsertCategory}
            >
              {editingCategoryId ? "Simpan" : "Tambah"}
            </button>
          </div>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
            {Array.isArray(categories) && categories.map((category) => (
              <div
                key={category.id || category.name || `category-${category.name}`}
                className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--color-secondary)]/25 px-4 py-3 text-base"
              >
                <p>{category.name}</p>
                <div className="flex gap-2">
                  <button type="button" className="font-semibold text-[var(--color-primary)]" onClick={() => handleEditCategory(category.id)}>
                    Edit
                  </button>
                  {categories.length > 1 && (
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
