import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected === true;
      const reachable = state.isInternetReachable !== false;
      setIsOnline(connected && reachable);
    });

    // Check initial state
    NetInfo.fetch().then(state => {
      const connected = state.isConnected === true;
      const reachable = state.isInternetReachable !== false;
      setIsOnline(connected && reachable);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
}
