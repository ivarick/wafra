/**
mock repo
 */

import { CROPS } from "../../constants/crops";
import type { Crop, CropCategory } from "../../domain/entities/Crop";
import type { ICropRepository } from "../../domain/repositories/ICropRepository";

export class CropRepositoryMock implements ICropRepository {
  async getCrops(category?: CropCategory | "all"): Promise<Crop[]> {

    await this._delay(80);
    if (!category || category === "all") return [...CROPS];
    return CROPS.filter((c) => c.category === category);
  }

  async getCropById(id: string): Promise<Crop | null> {
    await this._delay(50);
    return CROPS.find((c) => c.id === id) ?? null;
  }

  async searchCrops(query: string): Promise<Crop[]> {
    await this._delay(60);
    const q = query.toLowerCase();
    return CROPS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameAr.includes(q) ||
        c.nameFr.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.diseases.some((d) => d.toLowerCase().includes(q))
    );
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
