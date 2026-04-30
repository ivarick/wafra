import { CropFactSheet } from '../entities/CropFactSheet';
import { OfflineContentRepository } from '../repositories/OfflineContentRepository';

export class GetCropBySlugUseCase {
  constructor(private readonly repo: OfflineContentRepository) {}

  execute(slug: string): Promise<CropFactSheet | null> {
    return this.repo.getCropBySlug(slug);
  }
}
