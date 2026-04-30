import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  I18nManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Disease } from '../../domain/entities/Disease';
import { offlineContentContainer } from '../../di';
import { OfflineBadge } from '../components/OfflineBadge';

const COLORS = {
  bg: '#F5F7F2',
  card: '#FFFFFF',
  primary: '#1E5C3A',
  text: '#111827',
  muted: '#6B7280',
  border: '#E9EDE6',
};

const SEVERITY: Record<Disease['severity'], {
  bg: string; text: string; border: string; label: string; labelAr: string;
}> = {
  low:    { bg: '#DCFCE7', text: '#166534', border: '#86EFAC', label: 'Faible',  labelAr: 'منخفضة' },
  medium: { bg: '#FEF9C3', text: '#713F12', border: '#FDE047', label: 'Moyenne', labelAr: 'متوسطة' },
  high:   { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', label: 'Élevée',  labelAr: 'مرتفعة' },
};

interface DiseaseDetailScreenProps {
  slug: string;
}

export function DiseaseDetailScreen({ slug }: DiseaseDetailScreenProps): JSX.Element {
  const [disease, setDisease] = useState<Disease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await offlineContentContainer().getDiseaseBySlugUseCase.execute(slug);
        if (!cancelled) setDisease(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error.message}</Text>
      </View>
    );
  }
  if (!disease) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>
          {I18nManager.isRTL ? 'لم يتم العثور على المرض.' : 'Maladie introuvable.'}
        </Text>
      </View>
    );
  }

  const sev = SEVERITY[disease.severity];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroText}>
          <Text style={styles.nameFr}>{disease.nameFr}</Text>
          <Text style={styles.nameAr}>{disease.nameAr}</Text>
          <Text style={styles.nameEn}>{disease.nameEn}</Text>
        </View>
        <OfflineBadge />
      </View>

      <View style={[styles.sevBanner, { backgroundColor: sev.bg, borderColor: sev.border }]}>
        <Text style={[styles.sevLabel, { color: sev.text }]}>
          {I18nManager.isRTL ? `الشدة: ${sev.labelAr}` : `Sévérité : ${sev.label}`}
        </Text>
      </View>

      <InfoSection title={I18nManager.isRTL ? 'الأعراض' : 'Symptômes'} icon="🔬">
        <Text style={styles.bodyFr}>{disease.symptomsFr}</Text>
        <Text style={[styles.bodyAr]}>{disease.symptomsAr}</Text>
      </InfoSection>

      <InfoSection title={I18nManager.isRTL ? 'العلاج' : 'Traitement'} icon="💊">
        <Text style={styles.bodyFr}>{disease.treatmentFr}</Text>
        <Text style={[styles.bodyAr]}>{disease.treatmentAr}</Text>
      </InfoSection>

      {(disease.preventionFr || disease.preventionAr) && (
        <InfoSection title={I18nManager.isRTL ? 'الوقاية' : 'Prévention'} icon="🛡">
          {!!disease.preventionFr && <Text style={styles.bodyFr}>{disease.preventionFr}</Text>}
          {!!disease.preventionAr && <Text style={styles.bodyAr}>{disease.preventionAr}</Text>}
        </InfoSection>
      )}

      {disease.affectedCropSlugs.length > 0 && (
        <InfoSection title={I18nManager.isRTL ? 'المحاصيل المتأثرة' : 'Cultures touchées'} icon="🌾">
          <View style={styles.slugsWrap}>
            {disease.affectedCropSlugs.map((s) => (
              <View key={s} style={styles.slugChip}>
                <Text style={styles.slugText}>{s}</Text>
              </View>
            ))}
          </View>
        </InfoSection>
      )}
    </ScrollView>
  );
}

function InfoSection({
  title, icon, children,
}: { title: string; icon: string; children: React.ReactNode }): JSX.Element {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  heroText: { flex: 1 },
  nameFr: { fontSize: 26, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  nameAr: { fontSize: 18, color: COLORS.muted, writingDirection: 'rtl', marginTop: 4 },
  nameEn: { fontSize: 13, color: COLORS.muted, marginTop: 2, fontStyle: 'italic' },
  sevBanner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
  },
  sevLabel: { fontSize: 13, fontWeight: '700' },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
    backgroundColor: '#F9FBF8',
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.3 },
  sectionBody: { padding: 16, gap: 8 },
  bodyFr: { fontSize: 14, color: COLORS.text, lineHeight: 21 },
  bodyAr: { fontSize: 14, color: COLORS.muted, lineHeight: 21, writingDirection: 'rtl' },
  slugsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slugChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  slugText: { fontSize: 12, fontWeight: '600', color: '#166534' },
  error: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
});
