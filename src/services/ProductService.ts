import apiClient from './api';
import type { Product, Category } from '@/types/pos';
import { StorageService, generateId } from './StorageService';
import { useAPI } from '@/utils/config';
import showToast from '@/components/ui/Toast';

export type CreateProductRequest = {
  name: string;
  price: number;
  stock?: number;
  category_id: number;
  photo?: string;
};

export type UpdateProductRequest = {
  name: string;
  price: number;
  stock?: number;
  category_id: number;
  photo?: string;
};

export type SearchProductsRequest = {
  search?: string;
  category_id?: number;
  limit?: number;
};

export type ProductCategory = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ProductResponse = {
  id: number;
  name: string;
  price: number;
  stock: number;
  photo: string;
  category_id?: number;
  categoryId?: string;  // From backend ProductResource
  category?: ProductCategory;
  created_at: string;
  updated_at: string;
};

class ProductService {
  private endpoint = '/products';
  private searchEndpoint = '/products/search';

  // Transform backend response to frontend format
  private transformProduct(backendProduct: ProductResponse): Product {
    console.log(`[ProductService] Transforming product:`, {
      backendId: backendProduct.id,
      backendName: backendProduct.name,
      backendCategoryId: backendProduct.category_id,
      backendCategoryIdDirect: backendProduct.categoryId,  // From ProductResource
      backendCategory: backendProduct.category,
      finalCategoryId: (backendProduct.categoryId || backendProduct.category_id)?.toString() || ''
    });

    return {
      id: backendProduct.id?.toString() || '',
      name: backendProduct.name || '',
      price: backendProduct.price || 0,
      stock: backendProduct.stock || 0,
      photo: backendProduct.photo || '',
      categoryId: (backendProduct.categoryId || backendProduct.category_id)?.toString() || '',
      createdAt: backendProduct.created_at || new Date().toISOString(),
    };
  }

  private transformProductArray(products: ProductResponse[]): Product[] {
    return products
      .filter(product => product && typeof product === 'object') // Filter out null/undefined/invalid products
      .map(this.transformProduct);
  }

  // Hybrid method: Get all products with optional filters
  async getProducts(params?: {
    category_id?: string;
    search?: string;
    limit?: number;
  }): Promise<Product[]> {
    if (this.shouldUseAPI()) {
      try {
        const searchParams = new URLSearchParams();

        if (params?.category_id) {
          searchParams.append('category_id', params.category_id);
        }
        if (params?.search) {
          searchParams.append('search', params.search);
        }
        if (params?.limit) {
          searchParams.append('limit', params.limit.toString());
        }

        const url = searchParams.toString() ? `${this.endpoint}?${searchParams}` : this.endpoint;

        const response = await apiClient.get<ProductResponse[]>(url);

        let productsData: ProductResponse[];

        if (Array.isArray(response)) {
          productsData = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          productsData = (response as any).data;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && Array.isArray((response as any).data.data)) {
          productsData = (response as any).data.data;
        } else {
          console.warn('[ProductService] Unexpected API response format:', response);
          return this.getLocalProductsWithFilter(params); // Fallback to localStorage
        }

        if (!Array.isArray(productsData)) {
          console.warn('[ProductService] Products data is not an array:', productsData);
          return this.getLocalProductsWithFilter(params); // Fallback to localStorage
        }

        const transformedProducts = this.transformProductArray(productsData);

        // Apply additional client-side filtering if needed
        return this.applyClientSideFilters(transformedProducts, params);
      } catch (error) {
        console.error('[ProductService] Error fetching products from API, falling back to localStorage:', error);
        return this.getLocalProductsWithFilter(params); // Fallback to localStorage
      }
    } else {
      return this.getLocalProductsWithFilter(params);
    }
  }

  // Helper method for localStorage filtering
  private getLocalProductsWithFilter(params?: {
    category_id?: string;
    search?: string;
    limit?: number;
  }): Product[] {
    let products = StorageService.getProducts();

    return this.applyClientSideFilters(products, params);
  }

  // Apply client-side filtering
  private applyClientSideFilters(products: Product[], params?: {
    category_id?: string;
    search?: string;
    limit?: number;
  }): Product[] {
    let filtered = products;

    if (params?.category_id && params.category_id !== 'all') {
      filtered = filtered.filter(product => product.categoryId === params.category_id);
    }

    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
      );
    }

    if (params?.limit && params.limit > 0) {
      filtered = filtered.slice(0, params.limit);
    }

    return filtered;
  }

  // Search products (dedicated endpoint)
  async searchProducts(data: SearchProductsRequest): Promise<Product[]> {
    try {
      const response = await apiClient.post<ProductResponse[]>(this.searchEndpoint, data);

      // Handle different API response formats
      let productsData: ProductResponse[];

      if (Array.isArray(response)) {
        productsData = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        productsData = (response as any).data;
      } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && Array.isArray((response as any).data.data)) {
        productsData = (response as any).data.data;
      } else {
        console.warn('Unexpected API response format:', response);
        return [];
      }

      // Ensure productsData is a valid array before transformation
      if (!Array.isArray(productsData)) {
        console.warn('Products data is not an array:', productsData);
        return [];
      }

      return this.transformProductArray(productsData);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Hybrid method: Create new product
  async createProduct(data: {
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    photo?: string;
  }): Promise<void> {
    try {
      if (this.shouldUseAPI()) {
        const apiRequest = {
          name: data.name,
          price: data.price,
          stock: data.stock,
          category_id: parseInt(data.categoryId),
          photo: data.photo || ''
        };

        const response = await apiClient.post<ProductResponse>(this.endpoint, apiRequest);

        let productData: ProductResponse;
        if (response && typeof response === 'object' && 'id' in response && (response as ProductResponse).id) {
          productData = response as ProductResponse;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && (response as any).data.id) {
          productData = (response as any).data;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && (response as any).data.data && typeof (response as any).data.data === 'object' && (response as any).data.data.id) {
          productData = (response as any).data.data;
        } else {
          throw new Error('Invalid product response from server');
        }

        showToast.productAdded(data.name);
      } else {
        // Local storage implementation
        const products = StorageService.getProducts();
        const newProduct: Product = {
          id: generateId(),
          name: data.name,
          price: data.price,
          stock: data.stock,
          categoryId: data.categoryId,
          photo: data.photo || '',
          createdAt: new Date().toISOString(),
        };
        StorageService.setProducts([...products, newProduct]);
        showToast.productAdded(data.name);
      }
    } catch (error: any) {
      showToast.error('Gagal menambahkan produk', error.message);
      throw error;
    }
  }

  // Hybrid method: Update product
  async updateProduct(id: string, data: {
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    photo?: string;
  }): Promise<void> {
    try {
      if (this.shouldUseAPI()) {
        const apiRequest = {
          name: data.name,
          price: data.price,
          stock: data.stock,
          category_id: parseInt(data.categoryId),
          photo: data.photo || ''
        };

        const response = await apiClient.put<ProductResponse>(`${this.endpoint}/${id}`, apiRequest);

        let productData: ProductResponse;
        if (response && typeof response === 'object' && 'id' in response && (response as ProductResponse).id) {
          productData = response as ProductResponse;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && (response as any).data.id) {
          productData = (response as any).data;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && (response as any).data.data && typeof (response as any).data.data === 'object' && (response as any).data.data.id) {
          productData = (response as any).data.data;
        } else {
          throw new Error('Invalid product response from server');
        }

        showToast.productUpdated(data.name);
      } else {
        // Local storage implementation
        const products = StorageService.getProducts();
        const updatedProducts = products.map(product =>
          product.id === id
            ? {
                ...product,
                name: data.name,
                price: data.price,
                stock: data.stock,
                categoryId: data.categoryId,
                photo: data.photo || '',
                createdAt: new Date().toISOString(),
              }
            : product
        );
        StorageService.setProducts(updatedProducts);
        showToast.productUpdated(data.name);
      }
    } catch (error: any) {
      showToast.error('Gagal mengupdate produk', error.message);
      throw error;
    }
  }

  // Hybrid method: Delete product
  async deleteProduct(id: string): Promise<void> {
    try {
      const products = await this.getProducts();
      const productToDelete = products.find(product => product.id === id);
      const productName = productToDelete?.name || '';

      if (this.shouldUseAPI()) {
        await apiClient.delete(`${this.endpoint}/${id}`);
        showToast.productDeleted(productName);
      } else {
        // Local storage implementation
        const updatedProducts = products.filter(product => product.id !== id);
        StorageService.setProducts(updatedProducts);
        showToast.productDeleted(productName);
      }
    } catch (error: any) {
      showToast.error('Gagal menghapus produk', error.message);
      throw error;
    }
  }

  // Utility methods
  async getProductById(id: string): Promise<Product | undefined> {
    const products = await this.getProducts();
    return products.find(product => product.id === id);
  }

  async updateProductStock(id: string, newStock: number): Promise<void> {
    if (this.shouldUseAPI()) {
      // API implementation would be here
      // For now, we'll just update locally
    }

    const products = StorageService.getProducts();
    const updatedProducts = products.map(product =>
      product.id === id ? { ...product, stock: newStock } : product
    );
    StorageService.setProducts(updatedProducts);
  }

  private shouldUseAPI(): boolean {
    return useAPI();
  }
}

export default new ProductService();