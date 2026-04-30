import { Disease } from '../entities/Disease';
import { OfflineContentRepository } from '../repositories/OfflineContentRepository';

export class GetDiseaseBySlugUseCase {
  constructor(private readonly repo: OfflineContentRepository) {}

  execute(slug: string): Promise<Disease | null> {
    return this.repo.getDiseaseBySlug(slug);
  }
}
