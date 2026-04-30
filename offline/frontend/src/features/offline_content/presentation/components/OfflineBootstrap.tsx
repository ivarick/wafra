import React from 'react';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';

export function OfflineBootstrap(): null {
  useNetworkStatus();
  useOfflineSync();
  return null;
}
