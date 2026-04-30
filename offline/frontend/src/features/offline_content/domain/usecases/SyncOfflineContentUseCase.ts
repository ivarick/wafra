import { OfflineContentRepository, SyncResult } from '../repositories/OfflineContentRepository';

export class SyncOfflineContentUseCase {
  constructor(private readonly repo: OfflineContentRepository) {}

  execute(): Promise<SyncResult> {
    return this.repo.syncFromRemote();
  }
}
