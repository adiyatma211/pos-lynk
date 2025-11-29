import { apiFetch } from './api';
import type { Product } from '@/types/pos';

export async function fetchProducts(params?: {
  categoryId?: number;
  search?: string;
  limit?: number;
}): Promise<Product[]> {

  try {
    const response = await apiFetch<{ data: Product[] }>('/products/search', {
      method: 'POST',
      body: JSON.stringify({
        category_id: params?.categoryId ?? null,
        search: params?.search ?? null,
        limit: params?.limit ?? null,
      }),
    });

    console.log('Products API response:', response);

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}


export async function createProduct(data: {
  name: string;
  price: number;
  stock?: number;
  categoryId: number;
  photo?: string;
}): Promise<Product> {
  return apiFetch<Product>('/products', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      price: data.price,
      stock: data.stock || 0,
      category_id: data.categoryId,
      photo: data.photo,
    }),
  });
}

export async function updateProduct(id: number, data: {
  name: string;
  price: number;
  stock?: number;
  categoryId: number;
  photo?: string;
}): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: data.name,
      price: data.price,
      stock: data.stock || 0,
      category_id: data.categoryId,
      photo: data.photo,
    }),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/products/${id}`, {
    method: 'DELETE',
  });
}
