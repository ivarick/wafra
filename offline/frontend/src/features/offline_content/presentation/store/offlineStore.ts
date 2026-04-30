import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  setOnline: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  setLastSyncedAt: (v: string) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: true,
  isSyncing: false,
  lastSyncedAt: null,
  setOnline: (v) => set({ isOnline: v }),
  setSyncing: (v) => set({ isSyncing: v }),
  setLastSyncedAt: (v) => set({ lastSyncedAt: v }),
}));
