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

import { Disease } from '../../domain/entities/Disease';
import { OfflineBadge } from '../components/OfflineBadge';
import { useDiseases } from '../hooks/useDiseases';

const COLORS = {
  bg: '#F5F7F2',
  card: '#FFFFFF',
  primary: '#1E5C3A',
  text: '#111827',
  muted: '#6B7280',
  border: '#E9EDE6',
  searchIcon: '#9CA3AF',
};

const SEVERITY: Record<Disease['severity'], { bg: string; text: string; label: string; labelAr: string }> = {
  low:    { bg: '#DCFCE7', text: '#166534', label: 'Faible',  labelAr: 'منخفضة' },
  medium: { bg: '#FEF9C3', text: '#713F12', label: 'Moyenne', labelAr: 'متوسطة' },
  high:   { bg: '#FEE2E2', text: '#991B1B', label: 'Élevée',  labelAr: 'مرتفعة' },
};

interface DiseasesListScreenProps {
  onSelectDisease?: (slug: string) => void;
}

const PLACEHOLDER = I18nManager.isRTL ? 'ابحث عن مرض…' : 'Rechercher une maladie…';

export function DiseasesListScreen({ onSelectDisease }: DiseasesListScreenProps): JSX.Element {
  const [query, setQuery] = useState('');
  const { data, loading, error, search } = useDiseases();

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
            {I18nManager.isRTL ? 'الأمراض' : 'Maladies'}
          </Text>
          <Text style={styles.subtitle}>
            {I18nManager.isRTL ? '١٠ أمراض شائعة' : '10 maladies communes'}
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
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      {!!error && <Text style={styles.error}>{error.message}</Text>}
      {empty && (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🌱</Text>
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
          <DiseaseCard disease={item} onPress={() => onSelectDisease?.(item.slug)} />
        )}
      />
    </View>
  );
}

function DiseaseCard({ disease, onPress }: { disease: Disease; onPress: () => void }): JSX.Element {
  const sev = SEVERITY[disease.severity];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardNames}>
          <Text style={styles.cardNameFr}>{disease.nameFr}</Text>
          <Text style={styles.cardNameAr}>{disease.nameAr}</Text>
        </View>
        <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
          <Text style={[styles.sevText, { color: sev.text }]}>
            {I18nManager.isRTL ? sev.labelAr : sev.label}
          </Text>
        </View>
      </View>
      {disease.affectedCropSlugs.length > 0 && (
        <View style={styles.cropsRow}>
          <Text style={styles.cropsLabel}>
            {I18nManager.isRTL ? 'المحاصيل: ' : 'Cultures : '}
          </Text>
          <Text style={styles.cropsValue} numberOfLines={1}>
            {disease.affectedCropSlugs.join(', ')}
          </Text>
        </View>
      )}
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
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.card,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.75 },
  cardTop: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardNames: { flex: 1 },
  cardNameFr: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardNameAr: { fontSize: 13, color: COLORS.muted, writingDirection: 'rtl', marginTop: 2 },
  sevPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 10,
  },
  sevText: { fontSize: 11, fontWeight: '700' },
  cropsRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cropsLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  cropsValue: { fontSize: 12, color: COLORS.muted, flex: 1 },
  centered: { alignItems: 'center', paddingTop: 48 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  empty: { fontSize: 15, color: COLORS.muted },
  error: { color: '#DC2626', marginHorizontal: 20, marginVertical: 8, fontSize: 14 },
});
