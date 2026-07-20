import { useEffect, useState } from 'react';
import { ClientRequest } from '@/types/requests';

interface UseRequestsOptions {
  limit?: number;
}

export function useRequests(options: UseRequestsOptions = {}) {
  const [data, setData] = useState<ClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/requests?limit=${options.limit || 50}`);
        if (!response.ok) throw new Error('Failed to fetch requests');
        const requests = await response.json();
        setData(requests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequests();
  }, [options.limit]);

  return { data, isLoading, error };
}
