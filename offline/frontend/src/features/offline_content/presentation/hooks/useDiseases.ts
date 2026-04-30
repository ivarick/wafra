import { useCallback, useEffect, useState } from 'react';

import { Disease } from '../../domain/entities/Disease';
import { offlineContentContainer } from '../../di';

interface UseDiseasesResult {
  data: Disease[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  search: (query: string) => Promise<void>;
}

export function useDiseases(initialQuery: string = ''): UseDiseasesResult {
  const [data, setData] = useState<Disease[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState<string>(initialQuery);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await offlineContentContainer().getDiseasesUseCase.execute(q || undefined);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(query);
  }, [load, query]);

  return {
    data,
    loading,
    error,
    refresh: () => load(query),
    search: async (q: string) => { setQuery(q); },
  };
}
