
export type CropCategory = "grain" | "fruit" | "vegetable" | "legume" | "tree_crop";

export interface Crop {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  category: CropCategory;
  image: string;
  rating: number;
  description: string;
  plantingSeason: string;
  harvestSeason: string;
  waterNeeds: string;
  soilType: string;
  diseases: string[];
  funFact: string;
  yieldAverage: string;
  yieldPotential: string;
}

export interface CropCategoryDefinition {
  id: string;
  label: string;
  labelAr: string;
  labelFr: string;
}
