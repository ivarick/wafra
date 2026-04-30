import { useCallback, useEffect, useRef } from 'react';

import { offlineContentContainer } from '../../di';
import { useOfflineStore } from '../store/offlineStore';

const STALE_AFTER_MS = 30 * 60 * 1000;

interface UseOfflineSyncResult {
  syncNow: () => Promise<boolean>;
}

export function useOfflineSync(): UseOfflineSyncResult {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const isSyncing = useOfflineStore((s) => s.isSyncing);
  const lastSyncedAt = useOfflineStore((s) => s.lastSyncedAt);
  const setSyncing = useOfflineStore((s) => s.setSyncing);
  const setLastSyncedAt = useOfflineStore((s) => s.setLastSyncedAt);

  const hasBootstrapped = useRef(false);
  const previousOnline = useRef(isOnline);

  const runSync = useCallback(async (): Promise<boolean> => {
    if (useOfflineStore.getState().isSyncing) return false;
    if (!useOfflineStore.getState().isOnline) return false;

    setSyncing(true);
    try {
      const { syncUseCase, repository } = offlineContentContainer();
      const result = await syncUseCase.execute();
      setLastSyncedAt(result.syncedAt);
      console.log(
        `[offline] sync ok @ ${result.syncedAt} (crops=${result.cropsUpdated}, diseases=${result.diseasesUpdated})`,
      );
      void repository;
      return true;
    } catch (err) {
      console.warn('[offline] sync failed:', err);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [setSyncing, setLastSyncedAt]);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    void (async () => {
      try {
        const stored = await offlineContentContainer().repository.getLastSyncAt();
        if (stored) setLastSyncedAt(stored);

        const isStale = !stored || Date.now() - new Date(stored).getTime() > STALE_AFTER_MS;
        if (useOfflineStore.getState().isOnline && isStale) {
          await runSync();
        }
      } catch (err) {
        console.warn('[offline] bootstrap failed:', err);
      }
    })();
  }, [runSync, setLastSyncedAt]);

  useEffect(() => {
    const wasOnline = previousOnline.current;
    previousOnline.current = isOnline;
    if (!wasOnline && isOnline) {
      void runSync();
    }
  }, [isOnline, runSync]);

  void isSyncing;
  void lastSyncedAt;

  return { syncNow: runSync };
}
