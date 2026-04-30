import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { useOfflineStore } from '../store/offlineStore';

export function OfflineBadge(): JSX.Element | null {
  const isOnline = useOfflineStore((s) => s.isOnline);
  if (isOnline) return null;

  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Text style={styles.label}>
        {I18nManager.isRTL ? 'غير متصل' : 'Hors ligne'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  label: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
