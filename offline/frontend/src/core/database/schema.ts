export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS crops (
    slug TEXT PRIMARY KEY,
    id INTEGER NOT NULL,
    name_ar TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    planting_calendar TEXT NOT NULL,
    water_needs TEXT NOT NULL,
    avg_yield TEXT,
    description_fr TEXT,
    description_ar TEXT,
    image_url TEXT,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS diseases (
    slug TEXT PRIMARY KEY,
    id INTEGER NOT NULL,
    name_ar TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    symptoms_fr TEXT,
    symptoms_ar TEXT,
    treatment_fr TEXT,
    treatment_ar TEXT,
    prevention_fr TEXT,
    prevention_ar TEXT,
    severity TEXT,
    image_url TEXT,
    affected_crop_slugs TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_crops_name_fr ON crops(name_fr);`,
  `CREATE INDEX IF NOT EXISTS idx_crops_name_ar ON crops(name_ar);`,
  `CREATE INDEX IF NOT EXISTS idx_diseases_name_fr ON diseases(name_fr);`,
  `CREATE INDEX IF NOT EXISTS idx_diseases_name_ar ON diseases(name_ar);`,
];

export const SYNC_META_KEYS = {
  LAST_SYNC_AT: 'last_sync_at',
} as const;
