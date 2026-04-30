
import type { Crop, CropCategory } from "../entities/Crop";
import type { ICropRepository } from "../repositories/ICropRepository";

export class GetCropsUseCase {
  constructor(private readonly repository: ICropRepository) {}

  async execute(category?: CropCategory | "all", searchQuery?: string): Promise<Crop[]> {
    if (searchQuery && searchQuery.trim().length > 0) {
      const results = await this.repository.searchCrops(searchQuery.trim());
      if (category && category !== "all") {
        return results.filter((c) => c.category === category);
      }
      return results;
    }
    return this.repository.getCrops(category);
  }
}

export class GetCropByIdUseCase {
  constructor(private readonly repository: ICropRepository) {}

  async execute(id: string): Promise<Crop | null> {
    return this.repository.getCropById(id);
  }
}
