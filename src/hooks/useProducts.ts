import { useState, useEffect, useCallback } from 'react';
import productService from '@/services/ProductService';
import { useAPI, STORAGE_KEYS } from '@/utils/config';
import type { Product } from '@/types/pos';

export interface CreateProductData {
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  photo?: string;
}

export interface UpdateProductData {
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  photo?: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldUseAPI = useAPI();

  // Load products from API or localStorage
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log(`[useProducts] Loading products. shouldUseAPI: ${shouldUseAPI}`);

    try {
      if (shouldUseAPI) {
        // Load from API
        console.log(`[useProducts] Calling productService.getProducts()`);
        const apiProducts = await productService.getProducts();
        console.log(`[useProducts] API returned ${apiProducts.length} products:`, apiProducts);

        // Ensure we always have an array
        if (Array.isArray(apiProducts)) {
          setProducts(apiProducts);
          console.log(`[useProducts] Set products state with ${apiProducts.length} items`);

          // Also update localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(apiProducts));
          }
        } else {
          console.warn('[useProducts] API response is not an array:', apiProducts);
          setProducts([]);
        }
      } else {
        // Load from localStorage
        console.log(`[useProducts] Loading from localStorage`);
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEYS.products);
          if (stored) {
            const parsedProducts = JSON.parse(stored);
            setProducts(Array.isArray(parsedProducts) ? parsedProducts : []);
          }
        }
      }
    } catch (err: any) {
      console.error('[useProducts] Error loading products:', err);
      setError(err.message || 'Gagal memuat produk');

      // Fallback to localStorage if API fails
      if (shouldUseAPI && typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.products);
        if (stored) {
          const parsedProducts = JSON.parse(stored);
          setProducts(Array.isArray(parsedProducts) ? parsedProducts : []);
        } else {
          setProducts([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [shouldUseAPI]);

  // Create product
  const createProduct = useCallback(async (data: CreateProductData) => {
    setError(null);

    try {
      if (shouldUseAPI) {
        // Create via API - the service doesn't return the created product
        await productService.createProduct({
          name: data.name,
          price: data.price,
          stock: data.stock,
          categoryId: data.categoryId,
          photo: data.photo,
        });

        // After creating, refetch the list to get the updated data
        const apiProducts = await productService.getProducts();
        if (Array.isArray(apiProducts)) {
          setProducts(apiProducts);
          // Update localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(apiProducts));
          }
        }

        // Find and return the newly created product
        const newProduct = apiProducts.find(product => product.name === data.name);
        if (!newProduct) {
          throw new Error('Failed to find created product');
        }
        return newProduct;
      } else {
        // Create locally
        const newProduct: Product = {
          id: Date.now().toString(),
          name: data.name,
          price: data.price,
          stock: data.stock,
          photo: data.photo,
          categoryId: data.categoryId,
          createdAt: new Date().toISOString(),
        };

        setProducts(prev => [...prev, newProduct]);

        // Update localStorage
        if (typeof window !== 'undefined') {
          const updated = [...products, newProduct];
          localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(updated));
        }

        return newProduct;
      }
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Gagal membuat produk');
      throw err;
    }
  }, [shouldUseAPI, products]);

  // Update product
  const updateProduct = useCallback(async (id: string, data: UpdateProductData) => {
    setError(null);

    try {
      if (shouldUseAPI) {
        // Update via API - the service doesn't return the updated product
        await productService.updateProduct(id, {
          name: data.name,
          price: data.price,
          stock: data.stock,
          categoryId: data.categoryId,
          photo: data.photo,
        });

        // After updating, refetch the list to get the updated data
        const apiProducts = await productService.getProducts();
        if (Array.isArray(apiProducts)) {
          setProducts(apiProducts);
          // Update localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(apiProducts));
          }
        }

        // Find and return the updated product
        const updatedProduct = apiProducts.find(product => product.id === id);
        if (!updatedProduct) {
          throw new Error('Failed to find updated product');
        }
        return updatedProduct;
      } else {
        // Update locally
        const updatedProduct: Product = {
          id,
          name: data.name,
          price: data.price,
          stock: data.stock,
          photo: data.photo,
          categoryId: data.categoryId,
          createdAt: new Date().toISOString(),
        };

        const updatedProducts = products.map(product =>
          product.id === id ? updatedProduct : product
        );

        setProducts(updatedProducts);

        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(updatedProducts));
        }

        return updatedProduct;
      }
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message || 'Gagal mengupdate produk');
      throw err;
    }
  }, [shouldUseAPI, products]);

  // Delete product
  const deleteProduct = useCallback(async (id: string) => {
    setError(null);

    try {
      if (shouldUseAPI) {
        await productService.deleteProduct(id);
      }

      const updatedProducts = products.filter(product => product.id !== id);

      setProducts(updatedProducts);

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(updatedProducts));
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Gagal menghapus produk');
      throw err;
    }
  }, [shouldUseAPI, products]);

  // Search products
  const searchProducts = useCallback(async (params: {
    search?: string;
    categoryId?: string;
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      if (shouldUseAPI) {
        const apiProducts = await productService.searchProducts({
          search: params.search,
          category_id: params.categoryId ? parseInt(params.categoryId) : undefined,
          limit: params.limit,
        });

        return apiProducts.map(product => ({
          id: product.id.toString(),
          name: product.name,
          price: product.price,
          stock: product.stock,
          photo: product.photo,
          categoryId: product.categoryId.toString(),
          createdAt: product.createdAt,
        }));
      } else {
        // Search locally
        return products.filter(product => {
          const matchSearch = !params.search ||
            product.name.toLowerCase().includes(params.search.toLowerCase());
          const matchCategory = !params.categoryId || product.categoryId === params.categoryId;
          return matchSearch && matchCategory;
        }).slice(0, params.limit || products.length);
      }
    } catch (err: any) {
      console.error('Error searching products:', err);
      setError(err.message || 'Gagal mencari produk');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [shouldUseAPI, products]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    refetch: loadProducts,
  };
};