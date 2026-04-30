import { CropFactSheet } from '../entities/CropFactSheet';
import { Disease } from '../entities/Disease';

export interface SyncResult {
  syncedAt: string;
  cropsUpdated: number;
  diseasesUpdated: number;
}

/**
 * Domain port. The data layer provides the concrete implementation; use cases
 * and the presentation layer depend only on this interface.
 */
export interface OfflineContentRepository {
  syncFromRemote(): Promise<SyncResult>;
  getCrops(searchQuery?: string): Promise<CropFactSheet[]>;
  getCropBySlug(slug: string): Promise<CropFactSheet | null>;
  getDiseases(searchQuery?: string): Promise<Disease[]>;
  getDiseaseBySlug(slug: string): Promise<Disease | null>;
  getLastSyncAt(): Promise<string | null>;
}
