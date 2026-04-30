import { useCallback, useEffect, useState } from 'react';

import { CropFactSheet } from '../../domain/entities/CropFactSheet';
import { offlineContentContainer } from '../../di';

interface UseCropsResult {
  data: CropFactSheet[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  search: (query: string) => Promise<void>;
}

export function useCrops(initialQuery: string = ''): UseCropsResult {
  const [data, setData] = useState<CropFactSheet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState<string>(initialQuery);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await offlineContentContainer().getCropsUseCase.execute(q || undefined);
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
