/** Pure domain entity — no framework imports. */
export type DiseaseSeverity = 'low' | 'medium' | 'high';

export interface Disease {
  id: number;
  slug: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  symptomsFr: string;
  symptomsAr: string;
  treatmentFr: string;
  treatmentAr: string;
  preventionFr: string;
  preventionAr: string;
  severity: DiseaseSeverity;
  imageUrl: string;
  affectedCropSlugs: string[];
  updatedAt: string;
}
