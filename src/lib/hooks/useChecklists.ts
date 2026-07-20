import { useEffect, useState } from 'react';
import { DailyChecklist, FormulaCheck } from '@/types/checklists';

export function useDailyChecklist() {
  const [data, setData] = useState<DailyChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChecklist() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/checklists/today');
        if (!response.ok) throw new Error('Failed to fetch checklist');
        const checklist = await response.json();
        setData(checklist);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchChecklist();
  }, []);

  return { data, isLoading, error };
}

export function useFormulaChecks() {
  const [data, setData] = useState<FormulaCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChecks() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/checklists/formula');
        if (!response.ok) throw new Error('Failed to fetch formula checks');
        const checks = await response.json();
        setData(checks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchChecks();
  }, []);

  return { data, isLoading, error };
}
