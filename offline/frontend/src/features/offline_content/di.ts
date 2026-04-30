import { getDb } from '@/core/database/database';

import { OfflineLocalDataSource } from './data/datasources/OfflineLocalDataSource';
import { OfflineRemoteDataSource } from './data/datasources/OfflineRemoteDataSource';
import { OfflineContentRepositoryImpl } from './data/repositories/OfflineContentRepositoryImpl';
import { GetCropBySlugUseCase } from './domain/usecases/GetCropBySlugUseCase';
import { GetCropsUseCase } from './domain/usecases/GetCropsUseCase';
import { GetDiseaseBySlugUseCase } from './domain/usecases/GetDiseaseBySlugUseCase';
import { GetDiseasesUseCase } from './domain/usecases/GetDiseasesUseCase';
import { SyncOfflineContentUseCase } from './domain/usecases/SyncOfflineContentUseCase';

interface OfflineContentContainer {
  repository: OfflineContentRepositoryImpl;
  syncUseCase: SyncOfflineContentUseCase;
  getCropsUseCase: GetCropsUseCase;
  getCropBySlugUseCase: GetCropBySlugUseCase;
  getDiseasesUseCase: GetDiseasesUseCase;
  getDiseaseBySlugUseCase: GetDiseaseBySlugUseCase;
}

let container: OfflineContentContainer | null = null;

export function initOfflineContentDi(): OfflineContentContainer {
  if (container) return container;

  const local = new OfflineLocalDataSource(getDb());
  const remote = new OfflineRemoteDataSource();
  const repository = new OfflineContentRepositoryImpl(local, remote);

  container = {
    repository,
    syncUseCase: new SyncOfflineContentUseCase(repository),
    getCropsUseCase: new GetCropsUseCase(repository),
    getCropBySlugUseCase: new GetCropBySlugUseCase(repository),
    getDiseasesUseCase: new GetDiseasesUseCase(repository),
    getDiseaseBySlugUseCase: new GetDiseaseBySlugUseCase(repository),
  };

  return container;
}

export function offlineContentContainer(): OfflineContentContainer {
  if (!container) {
    throw new Error(
      '[offline_content] DI not initialised. Call initOfflineContentDi() after initDatabase() at app startup.',
    );
  }
  return container;
}
