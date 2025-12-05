import apiClient from './api';
import type { Category } from '@/types/pos';
import { StorageService, generateId } from './StorageService';
import { useAPI } from '@/utils/config';
import showToast from '@/components/ui/Toast';

export type CreateCategoryRequest = {
  name: string;
};

export type UpdateCategoryRequest = {
  name: string;
};

export type CategoryResponse = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

class CategoryService {
  private endpoint = '/categories';

  // Transform backend response to frontend format
  private transformCategory(backendCategory: CategoryResponse): Category {
    return {
      id: backendCategory.id?.toString() || '',
      name: backendCategory.name || '',
      createdAt: backendCategory.created_at || new Date().toISOString(),
    };
  }

  private transformCategoryArray(categories: CategoryResponse[]): Category[] {
    return categories
      .filter(category => category && typeof category === 'object')
      .map(this.transformCategory);
  }

  // Hybrid method: Get all categories (API or localStorage)
  async getCategories(): Promise<Category[]> {
    if (this.shouldUseAPI()) {
      try {
        const response = await apiClient.get<CategoryResponse[]>(this.endpoint);

        let categoriesData: CategoryResponse[];

        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          categoriesData = (response as any).data;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && Array.isArray((response as any).data.data)) {
          categoriesData = (response as any).data.data;
        } else {
          console.warn('Unexpected API response format:', response);
          return StorageService.getCategories(); // Fallback to localStorage
        }

        return this.transformCategoryArray(categoriesData);
      } catch (error) {
        console.error('Error fetching categories from API, falling back to localStorage:', error);
        return StorageService.getCategories(); // Fallback to localStorage
      }
    } else {
      return StorageService.getCategories();
    }
  }

  // Hybrid method: Create new category
  async createCategory(name: string): Promise<void> {
    try {
      if (this.shouldUseAPI()) {
        const response = await apiClient.post<CategoryResponse>(this.endpoint, { name });

        let categoryData: CategoryResponse;
        if (response && typeof response === 'object' && 'id' in response && (response as CategoryResponse).id) {
          categoryData = response as CategoryResponse;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && (response as any).data.id) {
          categoryData = (response as any).data;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && (response as any).data.data && typeof (response as any).data.data === 'object' && (response as any).data.data.id) {
          categoryData = (response as any).data.data;
        } else {
          throw new Error('Invalid category response from server');
        }

        // Success with API
        showToast.categoryAdded(name);
      } else {
        // Local storage implementation
        const categories = StorageService.getCategories();
        const newCategory: Category = {
          id: generateId(),
          name,
          createdAt: new Date().toISOString(),
        };
        StorageService.setCategories([...categories, newCategory]);
        showToast.categoryAdded(name);
      }
    } catch (error: any) {
      showToast.error('Gagal menambahkan kategori', error.message);
      throw error;
    }
  }

  // Hybrid method: Update category
  async updateCategory(id: string, name: string): Promise<void> {
    try {
      if (this.shouldUseAPI()) {
        const response = await apiClient.put<CategoryResponse>(`${this.endpoint}/${id}`, { name });

        let categoryData: CategoryResponse;
        if (response && typeof response === 'object' && 'id' in response && (response as CategoryResponse).id) {
          categoryData = response as CategoryResponse;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && (response as any).data.id) {
          categoryData = (response as any).data;
        } else if (response && typeof response === 'object' && 'data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data && (response as any).data.data && typeof (response as any).data.data === 'object' && (response as any).data.data.id) {
          categoryData = (response as any).data.data;
        } else {
          throw new Error('Invalid category response from server');
        }

        showToast.categoryUpdated(name);
      } else {
        // Local storage implementation
        const categories = StorageService.getCategories();
        const updatedCategories = categories.map(cat =>
          cat.id === id ? { ...cat, name } : cat
        );
        StorageService.setCategories(updatedCategories);
        showToast.categoryUpdated(name);
      }
    } catch (error: any) {
      showToast.error('Gagal mengupdate kategori', error.message);
      throw error;
    }
  }

  // Hybrid method: Delete category
  async deleteCategory(id: string): Promise<void> {
    try {
      const categories = await this.getCategories();
      const categoryToDelete = categories.find(cat => cat.id === id);
      const categoryName = categoryToDelete?.name || '';

      if (this.shouldUseAPI()) {
        await apiClient.delete(`${this.endpoint}/${id}`);
        showToast.categoryDeleted(categoryName);
      } else {
        // Local storage implementation
        const updatedCategories = categories.filter(cat => cat.id !== id);
        StorageService.setCategories(updatedCategories);
        showToast.categoryDeleted(categoryName);
      }
    } catch (error: any) {
      showToast.error('Gagal menghapus kategori', error.message);
      throw error;
    }
  }

  // Utility methods
  async getCategoryById(id: string): Promise<Category | undefined> {
    const categories = await this.getCategories();
    return categories.find(cat => cat.id === id);
  }

  async categoryExists(name: string): Promise<boolean> {
    const categories = await this.getCategories();
    return categories.some(
      category => category.name.toLowerCase() === name.toLowerCase()
    );
  }

  private shouldUseAPI(): boolean {
    return useAPI();
  }
}

const categoryService = new CategoryService();

export default categoryService;