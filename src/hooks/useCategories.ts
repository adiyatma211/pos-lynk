import { useState, useEffect, useCallback } from 'react';
import categoryService from '../services/CategoryService';
import { useAPI, STORAGE_KEYS } from '@/utils/config';
import type { Category } from '@/types/pos';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldUseAPI = useAPI();

  // Load categories from API or localStorage
  const loadCategories = useCallback(async () => {
    console.log('[useCategories] Loading categories. shouldUseAPI:', shouldUseAPI);
    setIsLoading(true);
    setError(null);

    try {
      if (shouldUseAPI) {
        console.log('[useCategories] Loading from API...');
        // Load from API
        const apiCategories = await categoryService.getCategories();

        console.log('[useCategories] API returned:', apiCategories);

        // Ensure we always have an array
        if (Array.isArray(apiCategories)) {
          console.log('[useCategories] Setting categories state:', apiCategories.length);
          setCategories(apiCategories);

          // Also update localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(apiCategories));
          }
        } else {
          console.warn('API response is not an array:', apiCategories);
          setCategories([]);
        }
      } else {
        // Load from localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEYS.categories);
          if (stored) {
            const parsedCategories = JSON.parse(stored);
            setCategories(Array.isArray(parsedCategories) ? parsedCategories : []);
          } else {
            // Default category
            const defaultCategory: Category = {
              id: '1',
              name: 'Umum',
              createdAt: new Date().toISOString(),
            };
            setCategories([defaultCategory]);
            localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify([defaultCategory]));
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError(err.message || 'Gagal memuat kategori');

      // Fallback to localStorage if API fails
      if (shouldUseAPI && typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.categories);
        if (stored) {
          const parsedCategories = JSON.parse(stored);
          setCategories(Array.isArray(parsedCategories) ? parsedCategories : []);
        } else {
          setCategories([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [shouldUseAPI]);

  // Create category
  const createCategory = useCallback(async (name: string) => {
    setError(null);

    try {
      if (shouldUseAPI) {
        // Create via API - the service doesn't return the created category
        await categoryService.createCategory(name);

        // After creating, refetch the list to get the updated data
        const apiCategories = await categoryService.getCategories();
        if (Array.isArray(apiCategories)) {
          setCategories(apiCategories);
          // Update localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(apiCategories));
          }
        }

        // Find and return the newly created category
        const newCategory = apiCategories.find(cat => cat.name === name);
        if (!newCategory) {
          throw new Error('Failed to find created category');
        }
        return newCategory;
      } else {
        // Create locally
        const newCategory: Category = {
          id: Date.now().toString(),
          name,
          createdAt: new Date().toISOString(),
        };

        setCategories(prev => [...prev, newCategory]);

        // Update localStorage
        if (typeof window !== 'undefined') {
          const updated = [...categories, newCategory];
          localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(updated));
        }

        return newCategory;
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
      setError(err.message || 'Gagal membuat kategori');
      throw err;
    }
  }, [shouldUseAPI, categories]);

  // Update category
  const updateCategory = useCallback(async (id: string, name: string) => {
    setError(null);

    try {
      if (shouldUseAPI) {
        // Update via API - the service doesn't return the updated category
        await categoryService.updateCategory(id, name);

        // After updating, refetch the list to get the updated data
        const apiCategories = await categoryService.getCategories();
        if (Array.isArray(apiCategories)) {
          setCategories(apiCategories);
          // Update localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(apiCategories));
          }
        }

        // Find and return the updated category
        const updatedCategory = apiCategories.find(cat => cat.id === id);
        if (!updatedCategory) {
          throw new Error('Failed to find updated category');
        }
        return updatedCategory;
      } else {
        // Update locally
        const updatedCategory: Category = {
          id,
          name,
          createdAt: new Date().toISOString(),
        };

        setCategories(prev => prev.map(cat =>
          cat.id === id ? updatedCategory : cat
        ));

        // Update localStorage
        if (typeof window !== 'undefined') {
          const updated = categories.map(cat =>
            cat.id === id ? updatedCategory : cat
          );
          localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(updated));
        }

        return updatedCategory;
      }
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError(err.message || 'Gagal mengupdate kategori');
      throw err;
    }
  }, [shouldUseAPI, categories]);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    setError(null);

    try {
      if (shouldUseAPI) {
        await categoryService.deleteCategory(id);
      }

      setCategories(prev => prev.filter(cat => cat.id !== id));

      // Update localStorage
      if (typeof window !== 'undefined') {
        const updated = categories.filter(cat => cat.id !== id);
        localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(updated));
      }
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Gagal menghapus kategori');
      throw err;
    }
  }, [shouldUseAPI, categories]);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: loadCategories,
  };
};