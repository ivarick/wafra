import { CropFactSheetDto } from '../models/CropFactSheetModel';
import { DiseaseDto } from '../models/DiseaseModel';

// @ts-ignore — path resolved via the host project's tsconfig path aliases.
import { apiClient } from '@/core/api/apiClient';

export interface SyncPayload {
  server_time: string;
  crops: CropFactSheetDto[];
  diseases: DiseaseDto[];
  deleted_crop_slugs: string[];
  deleted_disease_slugs: string[];
}

export class OfflineRemoteDataSource {
  private readonly endpoint = '/api/v1/offline/sync/';

  async sync(opts?: { since?: string | null }): Promise<SyncPayload> {
    const params: Record<string, string> = {};
    if (opts?.since) params.since = opts.since;

    const response = await apiClient.get<SyncPayload>(this.endpoint, { params });
    return response.data;
  }
}
