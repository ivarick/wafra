import { CropFactSheet } from '../entities/CropFactSheet';
import { OfflineContentRepository } from '../repositories/OfflineContentRepository';

export class GetCropsUseCase {
  constructor(private readonly repo: OfflineContentRepository) {}

  execute(searchQuery?: string): Promise<CropFactSheet[]> {
    return this.repo.getCrops(searchQuery);
  }
}
