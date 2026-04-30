import type * as SQLite from 'expo-sqlite';

import { SYNC_META_KEYS } from '@/core/database/schema';
import { CropFactSheet } from '../../domain/entities/CropFactSheet';
import { Disease, DiseaseSeverity } from '../../domain/entities/Disease';

interface CropRow {
  slug: string;
  id: number;
  name_ar: string;
  name_fr: string;
  name_en: string;
  planting_calendar: string;
  water_needs: string;
  avg_yield: string | null;
  description_fr: string | null;
  description_ar: string | null;
  image_url: string | null;
  updated_at: string;
}

interface DiseaseRow {
  slug: string;
  id: number;
  name_ar: string;
  name_fr: string;
  name_en: string;
  symptoms_fr: string | null;
  symptoms_ar: string | null;
  treatment_fr: string | null;
  treatment_ar: string | null;
  prevention_fr: string | null;
  prevention_ar: string | null;
  severity: string | null;
  image_url: string | null;
  affected_crop_slugs: string;
  updated_at: string;
}

interface MetaRow {
  value: string;
}

function rowToCrop(row: CropRow): CropFactSheet {
  const planting = JSON.parse(row.planting_calendar) as { sow?: string[]; harvest?: string[] };
  const water = JSON.parse(row.water_needs) as {
    litersPerM2PerWeek?: number;
    notesFr?: string;
    notesAr?: string;
  };
  return {
    id: row.id,
    slug: row.slug,
    nameAr: row.name_ar,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    plantingCalendar: {
      sow: planting.sow ?? [],
      harvest: planting.harvest ?? [],
    },
    waterNeeds: {
      litersPerM2PerWeek: water.litersPerM2PerWeek ?? 0,
      notesFr: water.notesFr ?? '',
      notesAr: water.notesAr ?? '',
    },
    avgYield: row.avg_yield ?? '',
    descriptionFr: row.description_fr ?? '',
    descriptionAr: row.description_ar ?? '',
    imageUrl: row.image_url ?? '',
    updatedAt: row.updated_at,
  };
}

function rowToDisease(row: DiseaseRow): Disease {
  const slugs = JSON.parse(row.affected_crop_slugs) as string[];
  const severity = (row.severity ?? 'medium') as DiseaseSeverity;
  return {
    id: row.id,
    slug: row.slug,
    nameAr: row.name_ar,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    symptomsFr: row.symptoms_fr ?? '',
    symptomsAr: row.symptoms_ar ?? '',
    treatmentFr: row.treatment_fr ?? '',
    treatmentAr: row.treatment_ar ?? '',
    preventionFr: row.prevention_fr ?? '',
    preventionAr: row.prevention_ar ?? '',
    severity,
    imageUrl: row.image_url ?? '',
    affectedCropSlugs: slugs,
    updatedAt: row.updated_at,
  };
}

export class OfflineLocalDataSource {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async upsertCrops(crops: CropFactSheet[]): Promise<void> {
    if (crops.length === 0) return;
    await this.db.withTransactionAsync(async () => {
      for (const c of crops) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO crops (
             slug, id, name_ar, name_fr, name_en,
             planting_calendar, water_needs, avg_yield,
             description_fr, description_ar, image_url, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.slug, c.id, c.nameAr, c.nameFr, c.nameEn,
            JSON.stringify(c.plantingCalendar),
            JSON.stringify(c.waterNeeds),
            c.avgYield, c.descriptionFr, c.descriptionAr, c.imageUrl, c.updatedAt,
          ],
        );
      }
    });
  }

  async upsertDiseases(diseases: Disease[]): Promise<void> {
    if (diseases.length === 0) return;
    await this.db.withTransactionAsync(async () => {
      for (const d of diseases) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO diseases (
             slug, id, name_ar, name_fr, name_en,
             symptoms_fr, symptoms_ar, treatment_fr, treatment_ar,
             prevention_fr, prevention_ar, severity, image_url,
             affected_crop_slugs, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            d.slug, d.id, d.nameAr, d.nameFr, d.nameEn,
            d.symptomsFr, d.symptomsAr, d.treatmentFr, d.treatmentAr,
            d.preventionFr, d.preventionAr, d.severity, d.imageUrl,
            JSON.stringify(d.affectedCropSlugs), d.updatedAt,
          ],
        );
      }
    });
  }

  async deleteCropsBySlugs(slugs: string[]): Promise<void> {
    if (slugs.length === 0) return;
    const placeholders = slugs.map(() => '?').join(',');
    await this.db.runAsync(`DELETE FROM crops WHERE slug IN (${placeholders})`, slugs);
  }

  async deleteDiseasesBySlugs(slugs: string[]): Promise<void> {
    if (slugs.length === 0) return;
    const placeholders = slugs.map(() => '?').join(',');
    await this.db.runAsync(`DELETE FROM diseases WHERE slug IN (${placeholders})`, slugs);
  }

  async getAllCrops(searchQuery?: string): Promise<CropFactSheet[]> {
    const q = searchQuery?.trim();
    let rows: CropRow[];
    if (q) {
      const like = `%${q}%`;
      rows = await this.db.getAllAsync<CropRow>(
        `SELECT * FROM crops WHERE name_fr LIKE ? OR name_ar LIKE ? OR name_en LIKE ? ORDER BY name_fr ASC`,
        [like, like, like],
      );
    } else {
      rows = await this.db.getAllAsync<CropRow>(`SELECT * FROM crops ORDER BY name_fr ASC`);
    }
    return rows.map(rowToCrop);
  }

  async getCropBySlug(slug: string): Promise<CropFactSheet | null> {
    const row = await this.db.getFirstAsync<CropRow>(`SELECT * FROM crops WHERE slug = ? LIMIT 1`, [slug]);
    return row ? rowToCrop(row) : null;
  }

  async getAllDiseases(searchQuery?: string): Promise<Disease[]> {
    const q = searchQuery?.trim();
    let rows: DiseaseRow[];
    if (q) {
      const like = `%${q}%`;
      rows = await this.db.getAllAsync<DiseaseRow>(
        `SELECT * FROM diseases WHERE name_fr LIKE ? OR name_ar LIKE ? OR name_en LIKE ? ORDER BY name_fr ASC`,
        [like, like, like],
      );
    } else {
      rows = await this.db.getAllAsync<DiseaseRow>(`SELECT * FROM diseases ORDER BY name_fr ASC`);
    }
    return rows.map(rowToDisease);
  }

  async getDiseaseBySlug(slug: string): Promise<Disease | null> {
    const row = await this.db.getFirstAsync<DiseaseRow>(`SELECT * FROM diseases WHERE slug = ? LIMIT 1`, [slug]);
    return row ? rowToDisease(row) : null;
  }

  async getLastSyncAt(): Promise<string | null> {
    const row = await this.db.getFirstAsync<MetaRow>(
      `SELECT value FROM sync_meta WHERE key = ? LIMIT 1`,
      [SYNC_META_KEYS.LAST_SYNC_AT],
    );
    return row?.value ?? null;
  }

  async setLastSyncAt(value: string): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`,
      [SYNC_META_KEYS.LAST_SYNC_AT, value],
    );
  }
}
