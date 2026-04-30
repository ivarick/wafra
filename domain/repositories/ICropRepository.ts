
import type { Crop, CropCategory } from "../entities/Crop";

export interface ICropRepository {

  getCrops(category?: CropCategory | "all"): Promise<Crop[]>;

 
  getCropById(id: string): Promise<Crop | null>;


  searchCrops(query: string): Promise<Crop[]>;
}
