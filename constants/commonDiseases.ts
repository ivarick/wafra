export type CommonDisease = {
  id: string;
  name: string;
  crop: string;
  summary: string;
  advice: string;
};

export const COMMON_DISEASES: CommonDisease[] = [
  {
    id: "late_blight",
    name: "Late Blight",
    crop: "Tomato / Potato",
    summary: "Fast fungal spread in humid and cool weather.",
    advice: "Improve airflow, avoid leaf wetness, and apply preventive fungicide early.",
  },
  {
    id: "early_blight",
    name: "Early Blight",
    crop: "Tomato / Potato",
    summary: "Brown concentric lesions on older leaves.",
    advice: "Remove infected debris, rotate crops, and keep foliage dry.",
  },
  {
    id: "powdery_mildew",
    name: "Powdery Mildew",
    crop: "Wheat / Vegetable crops",
    summary: "White powdery patches that reduce vigor.",
    advice: "Prune dense canopy and treat quickly once first patches appear.",
  },
  {
    id: "downy_mildew",
    name: "Downy Mildew",
    crop: "Onion / Cucurbits",
    summary: "Yellowing with grey mold under leaves.",
    advice: "Water at soil level and avoid late-evening irrigation.",
  },
  {
    id: "brown_rust",
    name: "Brown Rust",
    crop: "Wheat",
    summary: "Rust pustules reduce grain filling.",
    advice: "Scout weekly and apply fungicide at early spread stage.",
  },
  {
    id: "septoria",
    name: "Septoria Leaf Spot",
    crop: "Wheat / Tomato",
    summary: "Leaf spotting causing early defoliation.",
    advice: "Use clean residue management and rotate away from host crops.",
  },
  {
    id: "fusarium_wilt",
    name: "Fusarium Wilt",
    crop: "Watermelon / Tomato",
    summary: "Vascular wilt and sudden plant decline.",
    advice: "Use resistant varieties and avoid replanting in infested soil.",
  },
  {
    id: "bacterial_wilt",
    name: "Bacterial Wilt",
    crop: "Potato / Solanaceae",
    summary: "Rapid wilting, often irreversible once advanced.",
    advice: "Remove infected plants and sanitize tools between fields.",
  },
  {
    id: "botrytis",
    name: "Botrytis Gray Mold",
    crop: "Onion / Pepper",
    summary: "Gray mold under humid conditions.",
    advice: "Lower humidity in canopy and avoid excessive nitrogen.",
  },
  {
    id: "anthracnose",
    name: "Anthracnose",
    crop: "Watermelon / Pepper",
    summary: "Sunken dark lesions on leaves and fruits.",
    advice: "Remove infected tissue and maintain preventative protection schedule.",
  },
];
