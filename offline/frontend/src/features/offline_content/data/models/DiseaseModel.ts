import { Disease, DiseaseSeverity } from '../../domain/entities/Disease';

export interface DiseaseDto {
  id: number;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  symptoms_fr: string;
  symptoms_ar: string;
  treatment_fr: string;
  treatment_ar: string;
  prevention_fr: string;
  prevention_ar: string;
  severity: DiseaseSeverity;
  image_url: string;
  affected_crop_slugs: string[];
  updated_at: string;
}

export function diseaseDtoToEntity(dto: DiseaseDto): Disease {
  return {
    id: dto.id,
    slug: dto.slug,
    nameAr: dto.name_ar,
    nameFr: dto.name_fr,
    nameEn: dto.name_en,
    symptomsFr: dto.symptoms_fr ?? '',
    symptomsAr: dto.symptoms_ar ?? '',
    treatmentFr: dto.treatment_fr ?? '',
    treatmentAr: dto.treatment_ar ?? '',
    preventionFr: dto.prevention_fr ?? '',
    preventionAr: dto.prevention_ar ?? '',
    severity: dto.severity,
    imageUrl: dto.image_url ?? '',
    affectedCropSlugs: dto.affected_crop_slugs ?? [],
    updatedAt: dto.updated_at,
  };
}
