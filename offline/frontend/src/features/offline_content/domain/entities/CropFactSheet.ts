/** Pure domain entity — no framework imports. */
export interface PlantingCalendar {
  sow: string[];
  harvest: string[];
}

export interface WaterNeeds {
  litersPerM2PerWeek: number;
  notesFr: string;
  notesAr: string;
}

export interface CropFactSheet {
  id: number;
  slug: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  plantingCalendar: PlantingCalendar;
  waterNeeds: WaterNeeds;
  avgYield: string;
  descriptionFr: string;
  descriptionAr: string;
  imageUrl: string;
  updatedAt: string;
}
