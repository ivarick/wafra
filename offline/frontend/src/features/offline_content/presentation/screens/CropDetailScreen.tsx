import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  I18nManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CropFactSheet } from '../../domain/entities/CropFactSheet';
import { offlineContentContainer } from '../../di';
import { OfflineBadge } from '../components/OfflineBadge';

const COLORS = {
  bg: '#F5F7F2',
  card: '#FFFFFF',
  primary: '#1E5C3A',
  accent: '#3A8C5C',
  text: '#111827',
  muted: '#6B7280',
  border: '#E9EDE6',
  sectionLine: '#BBF7D0',
};

interface CropDetailScreenProps {
  slug: string;
}

export function CropDetailScreen({ slug }: CropDetailScreenProps): JSX.Element {
  const [crop, setCrop] = useState<CropFactSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await offlineContentContainer().getCropBySlugUseCase.execute(slug);
        if (!cancelled) setCrop(result);
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
        <ActivityIndicator size="large" color={COLORS.accent} />
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
  if (!crop) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>
          {I18nManager.isRTL ? 'لم يتم العثور على المحصول.' : 'Culture introuvable.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroText}>
          <Text style={styles.nameFr}>{crop.nameFr}</Text>
          <Text style={styles.nameAr}>{crop.nameAr}</Text>
          <Text style={styles.nameEn}>{crop.nameEn}</Text>
        </View>
        <OfflineBadge />
      </View>

      <View style={styles.statsRow}>
        <StatChip label={I18nManager.isRTL ? 'المردود' : 'Rendement'} value={crop.avgYield || '—'} />
        <StatChip
          label={I18nManager.isRTL ? 'الماء/أسبوع' : 'Eau/sem'}
          value={`${crop.waterNeeds.litersPerM2PerWeek} L/m²`}
        />
      </View>

      <InfoSection title={I18nManager.isRTL ? 'التقويم الزراعي' : 'Calendrier cultural'} icon="🗓">
        <View style={styles.calendarRow}>
          <CalendarChip
            label={I18nManager.isRTL ? 'بذر' : 'Semis'}
            months={crop.plantingCalendar.sow}
            color="#DCFCE7"
            textColor="#166534"
          />
          <CalendarChip
            label={I18nManager.isRTL ? 'حصاد' : 'Récolte'}
            months={crop.plantingCalendar.harvest}
            color="#FEF9C3"
            textColor="#713F12"
          />
        </View>
      </InfoSection>

      <InfoSection title={I18nManager.isRTL ? 'احتياجات الري' : 'Besoins en eau'} icon="💧">
        {!!crop.waterNeeds.notesFr && (
          <Text style={styles.bodyText}>{crop.waterNeeds.notesFr}</Text>
        )}
        {!!crop.waterNeeds.notesAr && (
          <Text style={[styles.bodyText, styles.rtl]}>{crop.waterNeeds.notesAr}</Text>
        )}
      </InfoSection>

      {(crop.descriptionFr || crop.descriptionAr) && (
        <InfoSection title={I18nManager.isRTL ? 'وصف' : 'Description'} icon="📋">
          {!!crop.descriptionFr && <Text style={styles.bodyText}>{crop.descriptionFr}</Text>}
          {!!crop.descriptionAr && (
            <Text style={[styles.bodyText, styles.rtl]}>{crop.descriptionAr}</Text>
          )}
        </InfoSection>
      )}
    </ScrollView>
  );
}

function StatChip({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CalendarChip({
  label, months, color, textColor,
}: { label: string; months: string[]; color: string; textColor: string }): JSX.Element {
  return (
    <View style={[styles.calChip, { backgroundColor: color }]}>
      <Text style={[styles.calChipLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.calChipMonths, { color: textColor }]}>
        {months.length > 0 ? months.join(' · ') : '—'}
      </Text>
    </View>
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
    marginBottom: 16,
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
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
  sectionBody: { padding: 16, gap: 6 },
  calendarRow: { flexDirection: 'row', gap: 10 },
  calChip: { flex: 1, borderRadius: 10, padding: 12 },
  calChipLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  calChipMonths: { fontSize: 13, fontWeight: '600' },
  bodyText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  rtl: { writingDirection: 'rtl' },
  error: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
});
