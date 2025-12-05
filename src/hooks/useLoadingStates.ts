import { useState, useCallback } from 'react';

type LoadingKey = 'categories' | 'products' | 'transactions' | 'dashboard' | 'saving' | 'deleting';

interface LoadingStates {
  [key: string]: boolean | undefined;
}

export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

  const setLoading = useCallback((key: LoadingKey, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((key: LoadingKey): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const setMultipleLoading = useCallback((states: Partial<LoadingStates>) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states,
    }));
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  // Helper methods for common loading patterns
  const startLoading = useCallback((key: LoadingKey) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: LoadingKey) => {
    setLoading(key, false);
  }, [setLoading]);

  const withLoading = useCallback(async <T>(
    key: LoadingKey,
    asyncFunction: () => Promise<T>
  ): Promise<T> => {
    try {
      startLoading(key);
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  // Check if any loading state is active
  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(state => state === true);
  }, [loadingStates]);

  // Check if specific loading states are active
  const areAnyLoading = useCallback((keys: LoadingKey[]): boolean => {
    return keys.some(key => loadingStates[key] === true);
  }, [loadingStates]);

  // Check if all specific loading states are active
  const areAllLoading = useCallback((keys: LoadingKey[]): boolean => {
    return keys.every(key => loadingStates[key] === true);
  }, [loadingStates]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    setMultipleLoading,
    clearAllLoading,
    startLoading,
    stopLoading,
    withLoading,
    isAnyLoading,
    areAnyLoading,
    areAllLoading,
  };
}