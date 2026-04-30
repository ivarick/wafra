import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CropFactSheet } from '../../domain/entities/CropFactSheet';
import { OfflineBadge } from '../components/OfflineBadge';
import { useCrops } from '../hooks/useCrops';

const COLORS = {
  bg: '#F5F7F2',
  card: '#FFFFFF',
  primary: '#1E5C3A',
  accent: '#3A8C5C',
  text: '#111827',
  muted: '#6B7280',
  border: '#E9EDE6',
  inputBg: '#FFFFFF',
  searchIcon: '#9CA3AF',
};

interface CropsListScreenProps {
  onSelectCrop?: (slug: string) => void;
}

const PLACEHOLDER = I18nManager.isRTL ? 'ابحث عن محصول…' : 'Rechercher une culture…';

export function CropsListScreen({ onSelectCrop }: CropsListScreenProps): JSX.Element {
  const [query, setQuery] = useState('');
  const { data, loading, error, search } = useCrops();

  const handleQueryChange = (next: string) => {
    setQuery(next);
    void search(next);
  };

  const empty = useMemo(
    () => !loading && !error && data.length === 0,
    [loading, error, data.length],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {I18nManager.isRTL ? 'المحاصيل' : 'Cultures'}
          </Text>
          <Text style={styles.subtitle}>
            {I18nManager.isRTL ? 'بطاقات المحاصيل الجزائرية' : 'Fiches des cultures algériennes'}
          </Text>
        </View>
        <OfflineBadge />
      </View>

      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={PLACEHOLDER}
          placeholderTextColor={COLORS.searchIcon}
          value={query}
          onChangeText={handleQueryChange}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      )}
      {!!error && <Text style={styles.error}>{error.message}</Text>}
      {empty && (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🌿</Text>
          <Text style={styles.empty}>
            {I18nManager.isRTL ? 'لا توجد نتائج' : 'Aucun résultat'}
          </Text>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CropCard crop={item} onPress={() => onSelectCrop?.(item.slug)} />
        )}
      />
    </View>
  );
}

function CropCard({ crop, onPress }: { crop: CropFactSheet; onPress: () => void }): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardNameFr}>{crop.nameFr}</Text>
        <Text style={styles.cardNameAr}>{crop.nameAr}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.yieldPill}>
          <Text style={styles.yieldText}>{crop.avgYield}</Text>
        </View>
        <Text style={styles.waterText}>
          {crop.waterNeeds.litersPerM2PerWeek} L/m²/sem
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.75 },
  cardLeft: { flex: 1 },
  cardNameFr: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardNameAr: {
    fontSize: 14,
    color: COLORS.muted,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  yieldPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  yieldText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  waterText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  centered: { alignItems: 'center', paddingTop: 48 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  empty: { fontSize: 15, color: COLORS.muted },
  error: { color: '#DC2626', marginHorizontal: 20, marginVertical: 8, fontSize: 14 },
});
