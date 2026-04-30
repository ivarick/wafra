import React from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { useOfflineStore } from '../store/offlineStore';

export function OfflineBanner(): JSX.Element | null {
  const isOnline = useOfflineStore((s) => s.isOnline);
  if (isOnline) return null;

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>⚡</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>
          {I18nManager.isRTL ? 'وضع عدم الاتصال' : 'Mode hors ligne'}
        </Text>
        <Text style={styles.subtitle}>
          {I18nManager.isRTL
            ? 'أنت تطّلع على البيانات المحفوظة'
            : 'Données enregistrées · cached data'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
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
});
