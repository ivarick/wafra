import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export type Unsubscribe = () => void;
export type NetworkListener = (isOnline: boolean) => void;

function deriveIsOnline(state: NetInfoState): boolean {
  const connected = state.isConnected === true;
  const reachable = state.isInternetReachable !== false;
  return connected && reachable;
}

export const NetworkMonitor = {
  subscribe(listener: NetworkListener): Unsubscribe {
    const sub: NetInfoSubscription = NetInfo.addEventListener((state) => {
      listener(deriveIsOnline(state));
    });
    NetInfo.fetch()
      .then((state) => listener(deriveIsOnline(state)))
      .catch(() => {});
    return sub;
  },

  async getCurrentStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return deriveIsOnline(state);
  },
};
