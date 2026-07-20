import { useEffect, useState } from 'react';
import { BudgetMetrics, CashMetrics } from '@/types/financial';

export function useCash() {
  const [data, setData] = useState<CashMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCash() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/financial/cash');
        if (!response.ok) throw new Error('Failed to fetch cash data');
        const cashData = await response.json();
        setData(cashData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCash();
  }, []);

  return { data, isLoading, error };
}

export function useBudget() {
  const [data, setData] = useState<BudgetMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBudget() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/financial/budget');
        if (!response.ok) throw new Error('Failed to fetch budget data');
        const budgetData = await response.json();
        setData(budgetData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBudget();
  }, []);

  return { data, isLoading, error };
}
