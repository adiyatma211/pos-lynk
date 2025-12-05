import { useState, useEffect } from "react";
import TransactionService from "@/services/TransactionService";
import { useAPI } from "@/utils/config";
import type { Transaction } from "@/types/pos";

export const useTransactions = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldUseAPI = useAPI();

  const fetchTransactions = async () => {
    if (!shouldUseAPI) {
      // For local mode, return empty array since data is handled by StorageService
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transactions = await TransactionService.getTransactions();
      console.log('Fetched transactions from API:', transactions); // Debug log
      setData(transactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = fetchTransactions;

  useEffect(() => {
    console.log('useTransactions effect triggered, shouldUseAPI:', shouldUseAPI); // Debug log
    fetchTransactions();
  }, [shouldUseAPI]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};