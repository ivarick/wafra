import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { useNetwork } from '@/hooks/useNetwork';
import { getOfflineCacheRefreshedAt } from '@/utils/offlineKnowledgeCache';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const raw = await getOfflineCacheRefreshedAt();
      if (!mounted || !raw) return;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return;
      setLastRefresh(date.toLocaleString());
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (isOnline) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>⚡</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Offline Mode</Text>
          <Text style={styles.subtitle}>
            Using cached crop fact sheets and 10 common diseases advice.
          </Text>
          {lastRefresh ? (
            <Text style={styles.timestamp}>Last cache refresh: {lastRefresh}</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFBEB',
  },
  container: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 14 },
  textBlock: { flexShrink: 1 },
  title: {
    color: '#78350F',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  subtitle: {
    color: '#92400E',
    fontSize: 11,
    marginTop: 1,
    opacity: 0.8,
  },
  timestamp: {
    color: '#78350F',
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
});
