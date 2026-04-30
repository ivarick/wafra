import { CropFactSheet } from '../../domain/entities/CropFactSheet';
import { Disease } from '../../domain/entities/Disease';
import {
  OfflineContentRepository,
  SyncResult,
} from '../../domain/repositories/OfflineContentRepository';
import { OfflineLocalDataSource } from '../datasources/OfflineLocalDataSource';
import { OfflineRemoteDataSource } from '../datasources/OfflineRemoteDataSource';
import { cropDtoToEntity } from '../models/CropFactSheetModel';
import { diseaseDtoToEntity } from '../models/DiseaseModel';

export class OfflineContentRepositoryImpl implements OfflineContentRepository {
  constructor(
    private readonly local: OfflineLocalDataSource,
    private readonly remote: OfflineRemoteDataSource,
  ) {}

  async syncFromRemote(): Promise<SyncResult> {
    const since = await this.local.getLastSyncAt();
    const payload = await this.remote.sync({ since });

    const crops = (payload.crops ?? []).map(cropDtoToEntity);
    const diseases = (payload.diseases ?? []).map(diseaseDtoToEntity);

    await this.local.upsertCrops(crops);
    await this.local.upsertDiseases(diseases);

    if (payload.deleted_crop_slugs?.length) {
      await this.local.deleteCropsBySlugs(payload.deleted_crop_slugs);
    }
    if (payload.deleted_disease_slugs?.length) {
      await this.local.deleteDiseasesBySlugs(payload.deleted_disease_slugs);
    }

    await this.local.setLastSyncAt(payload.server_time);

    return {
      syncedAt: payload.server_time,
      cropsUpdated: crops.length,
      diseasesUpdated: diseases.length,
    };
  }

  getCrops(searchQuery?: string): Promise<CropFactSheet[]> {
    return this.local.getAllCrops(searchQuery);
  }

  getCropBySlug(slug: string): Promise<CropFactSheet | null> {
    return this.local.getCropBySlug(slug);
  }

  getDiseases(searchQuery?: string): Promise<Disease[]> {
    return this.local.getAllDiseases(searchQuery);
  }

  getDiseaseBySlug(slug: string): Promise<Disease | null> {
    return this.local.getDiseaseBySlug(slug);
  }

  getLastSyncAt(): Promise<string | null> {
    return this.local.getLastSyncAt();
  }
}
