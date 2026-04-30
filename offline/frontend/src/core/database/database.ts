import * as SQLite from 'expo-sqlite';

import { SCHEMA_STATEMENTS } from './schema';

const DB_NAME = 'wafra_offline.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL;');
    for (const stmt of SCHEMA_STATEMENTS) {
      await db.execAsync(stmt);
    }
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error(
      '[database] getDb() called before initDatabase() resolved.',
    );
  }
  return dbInstance;
}

export async function _resetDatabaseForTests(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
  }
}
