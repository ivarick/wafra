/**
 * Wire-format DTO matching the Django serializer + mappers to the domain entity.
 * The mapping layer keeps `snake_case` out of the rest of the app.
 */
import { CropFactSheet, PlantingCalendar, WaterNeeds } from '../../domain/entities/CropFactSheet';

export interface CropFactSheetDto {
  id: number;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  planting_calendar: { sow: string[]; harvest: string[] };
  water_needs: {
    liters_per_m2_per_week: number;
    notes_fr?: string;
    notes_ar?: string;
  };
  avg_yield: string;
  description_fr: string;
  description_ar: string;
  image_url: string;
  updated_at: string;
}

export function cropDtoToEntity(dto: CropFactSheetDto): CropFactSheet {
  const planting: PlantingCalendar = {
    sow: dto.planting_calendar?.sow ?? [],
    harvest: dto.planting_calendar?.harvest ?? [],
  };
  const water: WaterNeeds = {
    litersPerM2PerWeek: dto.water_needs?.liters_per_m2_per_week ?? 0,
    notesFr: dto.water_needs?.notes_fr ?? '',
    notesAr: dto.water_needs?.notes_ar ?? '',
  };
  return {
    id: dto.id,
    slug: dto.slug,
    nameAr: dto.name_ar,
    nameFr: dto.name_fr,
    nameEn: dto.name_en,
    plantingCalendar: planting,
    waterNeeds: water,
    avgYield: dto.avg_yield ?? '',
    descriptionFr: dto.description_fr ?? '',
    descriptionAr: dto.description_ar ?? '',
    imageUrl: dto.image_url ?? '',
    updatedAt: dto.updated_at,
  };
}
