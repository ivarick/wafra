import { useEffect } from 'react';

import { NetworkMonitor } from '@/core/network/NetworkMonitor';
import { useOfflineStore } from '../store/offlineStore';

export function useNetworkStatus(): boolean {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const setOnline = useOfflineStore((s) => s.setOnline);

  useEffect(() => {
    const unsubscribe = NetworkMonitor.subscribe((next) => {
      setOnline(next);
    });
    return unsubscribe;
  }, [setOnline]);

  return isOnline;
}
