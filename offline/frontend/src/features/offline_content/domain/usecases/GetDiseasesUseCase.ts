import { Disease } from '../entities/Disease';
import { OfflineContentRepository } from '../repositories/OfflineContentRepository';

export class GetDiseasesUseCase {
  constructor(private readonly repo: OfflineContentRepository) {}

  execute(searchQuery?: string): Promise<Disease[]> {
    return this.repo.getDiseases(searchQuery);
  }
}
