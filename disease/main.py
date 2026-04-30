"""
WAFRA — Crop Disease Diagnosis API
====================================
Powered by a Vision Transformer (ViT-base-patch16-224) fine-tuned on the
PlantVillage dataset (38 disease classes across 14 crops).

Model: hussesey/vit-plantdisease  (~330 MB, downloaded on first run)
Crop auto-detection: openai/clip-vit-base-patch32 (zero-shot CLIP)

API Endpoints
-------------
POST /diagnose  — classify a leaf/fruit photo (optional ?crop= filter)
GET  /crops     — list supported crops
GET  /health    — service health check
GET  /          — static web frontend

Run
---
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import io
import logging
import os
import time
from dataclasses import dataclass
from typing import Dict, List, Optional
from uuid import uuid4

import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel
from transformers import (
    ViTImageProcessor,
    AutoModelForImageClassification,
    AutoModelForZeroShotImageClassification,
    AutoProcessor,
)

# ─── Path config ────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(__file__)
STATIC_DIR = os.path.join(BASE_DIR, "static")
GENERATED_DIR = os.path.join(STATIC_DIR, "generated")
# Local cache dir so the model is only downloaded once
HF_CACHE   = os.path.join(BASE_DIR, "model", "vit_cache")

HF_MODEL_ID = "hussesey/vit-plantdisease"
CROP_DETECTOR_MODEL_ID = "openai/clip-vit-base-patch32"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
os.makedirs(GENERATED_DIR, exist_ok=True)

# ─── Labels (38 PlantVillage classes) ───────────────────────────────────────
# Indices must match hussesey/vit-plantdisease id2label exactly (verified).
LABELS = {
    0:  {"crop": "Apple",       "disease": "Apple Scab",              "healthy": False, "severity": "moderate",  "treatment": "Apply fungicide (captan or myclobutanil) at bud break. Remove and destroy fallen leaves. Prune for better air circulation."},
    1:  {"crop": "Apple",       "disease": "Black Rot",               "healthy": False, "severity": "high",      "treatment": "Remove infected fruit and branches. Apply copper-based fungicide. Avoid wounding the bark."},
    2:  {"crop": "Apple",       "disease": "Cedar Apple Rust",        "healthy": False, "severity": "moderate",  "treatment": "Apply myclobutanil or mancozeb fungicide during spring. Remove nearby juniper hosts if possible."},
    3:  {"crop": "Apple",       "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring and good agricultural practices."},
    4:  {"crop": "Blueberry",   "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    5:  {"crop": "Cherry",      "disease": "Powdery Mildew",          "healthy": False, "severity": "moderate",  "treatment": "Apply sulfur or potassium bicarbonate spray. Improve air circulation by pruning. Avoid overhead irrigation."},
    6:  {"crop": "Cherry",      "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    7:  {"crop": "Corn",        "disease": "Gray Leaf Spot",          "healthy": False, "severity": "high",      "treatment": "Apply strobilurin fungicide (azoxystrobin). Use resistant varieties next season. Rotate crops and till residue."},
    8:  {"crop": "Corn",        "disease": "Common Rust",             "healthy": False, "severity": "moderate",  "treatment": "Apply mancozeb or triazole fungicide at first sign. Plant rust-resistant hybrids. Scout regularly."},
    9:  {"crop": "Corn",        "disease": "Northern Leaf Blight",    "healthy": False, "severity": "high",      "treatment": "Apply fungicide (propiconazole) at tasseling stage. Plant resistant varieties. Remove crop debris after harvest."},
    10: {"crop": "Corn",        "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    11: {"crop": "Grape",       "disease": "Black Rot",               "healthy": False, "severity": "high",      "treatment": "Apply mancozeb or captan before bloom. Remove mummified berries. Prune for air circulation."},
    12: {"crop": "Grape",       "disease": "Esca (Black Measles)",    "healthy": False, "severity": "high",      "treatment": "No fully effective chemical control. Remove and burn infected wood. Protect pruning wounds with fungicide paste."},
    13: {"crop": "Grape",       "disease": "Leaf Blight",             "healthy": False, "severity": "moderate",  "treatment": "Apply copper hydroxide fungicide. Remove infected leaves. Ensure proper drainage and reduce humidity."},
    14: {"crop": "Grape",       "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    15: {"crop": "Orange",      "disease": "Citrus Greening (HLB)",   "healthy": False, "severity": "critical",  "treatment": "No cure exists. Remove and destroy infected trees immediately. Control psyllid vector with insecticide. Notify local agricultural authority."},
    16: {"crop": "Peach",       "disease": "Bacterial Spot",          "healthy": False, "severity": "moderate",  "treatment": "Apply copper-based bactericide during dormancy. Avoid overhead irrigation. Use resistant varieties."},
    17: {"crop": "Peach",       "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    18: {"crop": "Pepper",      "disease": "Bacterial Spot",          "healthy": False, "severity": "moderate",  "treatment": "Apply copper hydroxide spray. Remove infected plant debris. Use certified disease-free seeds."},
    19: {"crop": "Pepper",      "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    20: {"crop": "Potato",      "disease": "Early Blight",            "healthy": False, "severity": "moderate",  "treatment": "Apply chlorothalonil or mancozeb at first symptoms. Ensure adequate potassium fertilization. Remove infected lower leaves."},
    21: {"crop": "Potato",      "disease": "Late Blight",             "healthy": False, "severity": "critical",  "treatment": "Apply metalaxyl + mancozeb immediately. Destroy infected plants. Avoid overhead irrigation. This spreads very fast — act today."},
    22: {"crop": "Potato",      "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    23: {"crop": "Raspberry",   "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    24: {"crop": "Soybean",     "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    25: {"crop": "Squash",      "disease": "Powdery Mildew",          "healthy": False, "severity": "moderate",  "treatment": "Spray potassium bicarbonate or sulfur-based fungicide. Increase plant spacing. Water at base, not on leaves."},
    26: {"crop": "Strawberry",  "disease": "Leaf Scorch",             "healthy": False, "severity": "moderate",  "treatment": "Apply captan fungicide. Remove and destroy infected leaves. Avoid over-fertilizing with nitrogen."},
    27: {"crop": "Strawberry",  "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
    28: {"crop": "Tomato",      "disease": "Bacterial Spot",          "healthy": False, "severity": "moderate",  "treatment": "Apply copper-based bactericide weekly. Remove infected leaves. Avoid working in field when wet."},
    29: {"crop": "Tomato",      "disease": "Early Blight",            "healthy": False, "severity": "moderate",  "treatment": "Apply chlorothalonil or mancozeb every 7–10 days. Mulch to prevent soil splash. Rotate crops next season."},
    30: {"crop": "Tomato",      "disease": "Late Blight",             "healthy": False, "severity": "critical",  "treatment": "Apply metalaxyl + mancozeb immediately. Remove and bag infected plants — do not compost. Highly contagious, act fast."},
    31: {"crop": "Tomato",      "disease": "Leaf Mold",               "healthy": False, "severity": "moderate",  "treatment": "Improve greenhouse ventilation. Apply chlorothalonil fungicide. Remove infected leaves promptly."},
    32: {"crop": "Tomato",      "disease": "Septoria Leaf Spot",      "healthy": False, "severity": "moderate",  "treatment": "Apply mancozeb or copper fungicide. Remove infected leaves. Mulch soil. Rotate with non-tomato crops."},
    33: {"crop": "Tomato",      "disease": "Spider Mites",            "healthy": False, "severity": "moderate",  "treatment": "Apply acaricide (abamectin or bifenazate). Increase humidity. Introduce predatory mites if available."},
    34: {"crop": "Tomato",      "disease": "Target Spot",             "healthy": False, "severity": "moderate",  "treatment": "Apply azoxystrobin or chlorothalonil. Improve drainage and air circulation. Remove heavily infected plants."},
    35: {"crop": "Tomato",      "disease": "Yellow Leaf Curl Virus",  "healthy": False, "severity": "critical",  "treatment": "No cure — remove and destroy infected plants immediately. Control whitefly vector with imidacloprid. Use virus-resistant varieties."},
    36: {"crop": "Tomato",      "disease": "Tomato Mosaic Virus",     "healthy": False, "severity": "high",      "treatment": "No cure. Remove infected plants. Disinfect tools with bleach. Wash hands before handling plants. Use certified virus-free seeds."},
    37: {"crop": "Tomato",      "disease": "Healthy",                 "healthy": True,  "severity": "none",      "treatment": "No treatment needed. Continue regular monitoring."},
}

SEVERITY_BADGE = {
    "none":     {"label": "Healthy",   "color": "#22c55e"},
    "moderate": {"label": "Moderate",  "color": "#f59e0b"},
    "high":     {"label": "High Risk", "color": "#ef4444"},
    "critical": {"label": "Critical",  "color": "#7c3aed"},
    "info":     {"label": "Info",      "color": "#38bdf8"},
}

# ─── Inference config ────────────────────────────────────────────────────────
INPUT_SIZE                   = (224, 224)
CONFIDENCE_THRESHOLD         = 0.24
MARGIN_THRESHOLD             = 0.09
AUTO_CROP_CONFIDENCE_THRESHOLD = 0.18
AUTO_CROP_MARGIN_THRESHOLD     = 0.04
AUTO_CROP_SUPPORTED_DELTA      = 0.035
TTA_VIEWS                    = 9
SOFTMAX_TEMPERATURE          = 1.15

EXPLANATIONS = {
    "early blight": "Detected circular brown lesions typically associated with fungal early blight.",
    "late blight": "Detected water-soaked to brown spreading lesions typical of aggressive blight infection.",
    "powdery mildew": "Detected powder-like bright patches on leaf surfaces consistent with mildew infection.",
    "leaf mold": "Detected mold-like leaf discoloration and patching patterns often seen in humid environments.",
    "septoria leaf spot": "Detected multiple small necrotic spots suggestive of septoria-type spotting.",
    "bacterial spot": "Detected clustered dark lesions with chlorotic halos, consistent with bacterial spotting.",
    "healthy": "No dominant pathological lesion pattern was detected; leaf appearance is mostly healthy.",
}

# ─── Per-class prior weights (same formula as before) ────────────────────────
_PLANTVILLAGE_COUNTS = [
    2016, 1987, 1760, 2159, 1502, 1052,  854, 1642,
    1907, 1908, 1859, 1180, 1383, 1076,  423, 5507,
    2297,  360, 2997, 1478, 2000, 1939,  152,  371,
    5090, 1835, 1109,  456, 2127, 1000, 1851,  952,
    1771, 1676, 1404, 5357,  373, 1591,
]
_counts      = np.array(_PLANTVILLAGE_COUNTS, dtype=np.float32)
_N           = _counts.sum()
_C           = len(_counts)
_raw_weights = (_N / (_C * _counts)) ** 0.25
PRIOR_WEIGHTS: np.ndarray = (
    _raw_weights / np.exp(np.log(_raw_weights).mean())
).astype(np.float32)

PRODUCE_CATALOG: Dict[str, Dict[str, object]] = {
    "apple":      {"label": "Apple",      "supported": True,  "prompts": ["apple leaf", "apple fruit"]},
    "avocado":    {"label": "Avocado",    "supported": False, "prompts": ["avocado leaf", "avocado fruit"]},
    "banana":     {"label": "Banana",     "supported": False, "prompts": ["banana leaf", "banana fruit"]},
    "bean":       {"label": "Bean",       "supported": False, "prompts": ["bean leaf", "bean pods"]},
    "blueberry":  {"label": "Blueberry",  "supported": True,  "prompts": ["blueberry leaf", "blueberry fruit"]},
    "broccoli":   {"label": "Broccoli",   "supported": False, "prompts": ["broccoli leaf", "broccoli head"]},
    "cabbage":    {"label": "Cabbage",    "supported": False, "prompts": ["cabbage leaf", "cabbage head"]},
    "carrot":     {"label": "Carrot",     "supported": False, "prompts": ["carrot leaf", "carrot root"]},
    "cassava":    {"label": "Cassava",    "supported": False, "prompts": ["cassava leaf", "cassava plant"]},
    "cauliflower":{"label": "Cauliflower","supported": False, "prompts": ["cauliflower leaf", "cauliflower head"]},
    "cherry":     {"label": "Cherry",     "supported": True,  "prompts": ["cherry leaf", "cherry fruit"]},
    "corn":       {"label": "Corn",       "supported": True,  "prompts": ["corn leaf", "maize leaf"]},
    "cucumber":   {"label": "Cucumber",   "supported": False, "prompts": ["cucumber leaf", "cucumber fruit"]},
    "eggplant":   {"label": "Eggplant",   "supported": False, "prompts": ["eggplant leaf", "eggplant fruit"]},
    "garlic":     {"label": "Garlic",     "supported": False, "prompts": ["garlic leaf", "garlic bulb"]},
    "grape":      {"label": "Grape",      "supported": True,  "prompts": ["grape leaf", "grape fruit"]},
    "kale":       {"label": "Kale",       "supported": False, "prompts": ["kale leaf", "kale plant"]},
    "lettuce":    {"label": "Lettuce",    "supported": False, "prompts": ["lettuce leaf", "lettuce head"]},
    "mango":      {"label": "Mango",      "supported": False, "prompts": ["mango leaf", "mango fruit"]},
    "okra":       {"label": "Okra",       "supported": False, "prompts": ["okra leaf", "okra pods"]},
    "onion":      {"label": "Onion",      "supported": False, "prompts": ["onion leaf", "onion bulb"]},
    "orange":     {"label": "Orange",     "supported": True,  "prompts": ["orange leaf", "orange fruit"]},
    "papaya":     {"label": "Papaya",     "supported": False, "prompts": ["papaya leaf", "papaya fruit"]},
    "peach":      {"label": "Peach",      "supported": True,  "prompts": ["peach leaf", "peach fruit"]},
    "pear":       {"label": "Pear",       "supported": False, "prompts": ["pear leaf", "pear fruit"]},
    "pepper":     {"label": "Pepper",     "supported": True,  "prompts": ["bell pepper leaf", "bell pepper fruit", "pepper leaf"]},
    "pineapple":  {"label": "Pineapple",  "supported": False, "prompts": ["pineapple leaf", "pineapple fruit"]},
    "potato":     {"label": "Potato",     "supported": True,  "prompts": ["potato leaf", "potato plant"]},
    "raspberry":  {"label": "Raspberry",  "supported": True,  "prompts": ["raspberry leaf", "raspberry fruit"]},
    "soybean":    {"label": "Soybean",    "supported": True,  "prompts": ["soybean leaf", "soybean plant"]},
    "spinach":    {"label": "Spinach",    "supported": False, "prompts": ["spinach leaf", "spinach bunch"]},
    "squash":     {"label": "Squash",     "supported": True,  "prompts": ["squash leaf", "squash fruit"]},
    "strawberry": {"label": "Strawberry", "supported": True,  "prompts": ["strawberry leaf", "strawberry fruit"]},
    "tomato":     {"label": "Tomato",     "supported": True,  "prompts": ["tomato leaf", "tomato fruit"]},
    "watermelon": {"label": "Watermelon", "supported": False, "prompts": ["watermelon leaf", "watermelon fruit"]},
    "zucchini":   {"label": "Zucchini",   "supported": False, "prompts": ["zucchini leaf", "zucchini fruit"]},
}

CROP_ALIASES = {
    "bell pepper": "pepper",
    "capsicum": "pepper",
    "maize": "corn",
    "sweet corn": "corn",
}


def _build_crop_class_map() -> Dict[str, List[int]]:
    crop_class_map: Dict[str, List[int]] = {}
    for idx, info in LABELS.items():
        key = info["crop"].lower()
        crop_class_map.setdefault(key, []).append(idx)
    return crop_class_map


def _build_crop_prompt_index() -> tuple[List[str], List[str]]:
    prompt_labels: List[str] = []
    prompt_to_crop: List[str] = []
    for crop_key, info in PRODUCE_CATALOG.items():
        for prompt in info["prompts"]:
            prompt_labels.append(f"a close-up field photo of {prompt}")
            prompt_to_crop.append(crop_key)
    return prompt_labels, prompt_to_crop


CROP_CLASS_MAP = _build_crop_class_map()
SUPPORTED_CROPS = sorted(CROP_CLASS_MAP.keys())
SUPPORTED_CROP_LABELS = [PRODUCE_CATALOG[key]["label"] for key in SUPPORTED_CROPS]
RECOGNIZED_EXTRA_CROPS = sorted(
    info["label"] for key, info in PRODUCE_CATALOG.items() if key not in CROP_CLASS_MAP
)
CROP_PROMPT_LABELS, CROP_PROMPT_TO_CROP = _build_crop_prompt_index()

# ─── Model singleton ─────────────────────────────────────────────────────────
_feature_extractor = None
_vit_model         = None
_crop_processor    = None
_crop_model        = None
_device            = torch.device("cpu")


@dataclass
class CropDetection:
    crop_key: str
    crop_name: str
    confidence: float
    margin: float
    supported: bool
    candidates: List[Dict[str, object]]
    confident: bool


def get_vit():
    global _feature_extractor, _vit_model
    if _vit_model is None:
        logger.info("Loading ViT model '%s' (downloads on first run) …", HF_MODEL_ID)
        _feature_extractor = ViTImageProcessor.from_pretrained(
            "google/vit-base-patch16-224",
            cache_dir=HF_CACHE,
        )
        _vit_model = AutoModelForImageClassification.from_pretrained(
            HF_MODEL_ID,
            cache_dir=HF_CACHE,
        )
        _vit_model.eval()
        _vit_model.to(_device)
        logger.info("ViT model ready on %s", _device)
    return _feature_extractor, _vit_model


def get_crop_detector():
    global _crop_processor, _crop_model
    if _crop_model is None:
        logger.info("Loading crop detector '%s'...", CROP_DETECTOR_MODEL_ID)
        _crop_processor = AutoProcessor.from_pretrained(
            CROP_DETECTOR_MODEL_ID,
            cache_dir=HF_CACHE,
        )
        _crop_model = AutoModelForZeroShotImageClassification.from_pretrained(
            CROP_DETECTOR_MODEL_ID,
            cache_dir=HF_CACHE,
        )
        _crop_model.eval()
        _crop_model.to(_device)
        logger.info("Crop detector ready on %s", _device)
    return _crop_processor, _crop_model


# ─── Preprocessing helpers ──────────────────────────────────────────────────

def _pick_resample(img: Image.Image) -> int:
    """Choose a resampling filter: BICUBIC for small images, LANCZOS for large."""
    width, height = img.size
    return Image.BICUBIC if min(width, height) < 300 else Image.LANCZOS


def _auto_contrast(img: Image.Image) -> Image.Image:
    """Stretch per-channel histogram to the [2nd, 98th] percentile range.

    Improves ViT accuracy on under/over-exposed field photos without
    introducing colour shift artefacts.
    """
    pixel_array = np.array(img, dtype=np.float32)
    output = np.empty_like(pixel_array)
    for channel in range(3):  # R, G, B
        channel_data = pixel_array[:, :, channel]
        low, high = np.percentile(channel_data, 2), np.percentile(channel_data, 98)
        if high - low < 20:  # already high-contrast — leave untouched
            output[:, :, channel] = channel_data
        else:
            output[:, :, channel] = np.clip(
                (channel_data - low) / (high - low) * 255.0, 0, 255
            )
    return Image.fromarray(output.astype(np.uint8))


def _aspect_center_crop(img: Image.Image, target: tuple) -> Image.Image:
    """Scale-then-centre-crop *img* to *target* (w, h), preserving aspect ratio."""
    target_w, target_h = target
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    scaled_w, scaled_h = int(src_w * scale + 0.5), int(src_h * scale + 0.5)
    img = img.resize((scaled_w, scaled_h), _pick_resample(img))
    left = (scaled_w - target_w) // 2
    top  = (scaled_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


def _aspect_tight_crop(img: Image.Image, target: tuple, zoom: float = 0.80) -> Image.Image:
    """Centre-crop *zoom* fraction of the image and resize to *target*.

    Provides a tighter field-of-view view for TTA diversity.
    """
    src_w, src_h = img.size
    target_w, target_h = target
    crop_w, crop_h = int(src_w * zoom), int(src_h * zoom)
    left = (src_w - crop_w) // 2
    top  = (src_h - crop_h) // 2
    inner = img.crop((left, top, left + crop_w, top + crop_h))
    return inner.resize((target_w, target_h), _pick_resample(inner))


def _corner_crop(img: Image.Image, target: tuple, corner: int) -> Image.Image:
    """Scale the image slightly beyond *target* and crop one of four corners.

    *corner* is 0–3 (top-left, top-right, bottom-left, bottom-right).
    The slight over-scale (×1.15) ensures the corner view still covers the
    full target dimensions without empty padding.
    """
    target_w, target_h = target
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h) * 1.15
    scaled_w = int(src_w * scale + 0.5)
    scaled_h = int(src_h * scale + 0.5)
    img = img.resize((scaled_w, scaled_h), _pick_resample(img))
    corner_offsets = [
        (0, 0),
        (scaled_w - target_w, 0),
        (0, scaled_h - target_h),
        (scaled_w - target_w, scaled_h - target_h),
    ]
    left, top = corner_offsets[corner % 4]
    return img.crop((left, top, left + target_w, top + target_h))


def _softmax(values: np.ndarray) -> np.ndarray:
    shifted = values - np.max(values)
    exp_values = np.exp(shifted)
    return exp_values / np.clip(exp_values.sum(), 1e-8, None)


# ─── ViT inference helpers ───────────────────────────────────────────────────

def _run_vit_batch(
    extractor,
    model,
    views: list,
) -> np.ndarray:
    """
    Batch all TTA views through the ViT in a single forward pass.
    Returns mean raw logits (float32 numpy, shape [num_classes]).
    """
    inputs = extractor(images=views, return_tensors="pt")
    inputs = {k: v.to(_device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)
    # outputs.logits: [batch_size, num_classes]
    logits = outputs.logits.cpu().numpy().astype(np.float32)
    return logits.mean(axis=0)


def _calibrated_softmax(
    logits: np.ndarray,
    T: float = SOFTMAX_TEMPERATURE,
    weights: Optional[np.ndarray] = None,
) -> np.ndarray:
    if weights is not None:
        logits = logits + np.log(np.clip(weights, 1e-8, None))
    return _softmax(logits / T)


def _normalise_crop_name(crop_name: str) -> str:
    crop_key = crop_name.strip().lower()
    return CROP_ALIASES.get(crop_key, crop_key)


def detect_crop(img: Image.Image) -> CropDetection:
    processor, model = get_crop_detector()
    inputs = processor(
        text=CROP_PROMPT_LABELS,
        images=img,
        return_tensors="pt",
        padding=True,
    )
    inputs = {k: v.to(_device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)

    prompt_logits = outputs.logits_per_image[0].cpu().numpy().astype(np.float32)
    crop_logits: Dict[str, float] = {}
    for idx, crop_key in enumerate(CROP_PROMPT_TO_CROP):
        score = float(prompt_logits[idx])
        previous = crop_logits.get(crop_key)
        if previous is None or score > previous:
            crop_logits[crop_key] = score

    ordered_keys = list(crop_logits.keys())
    crop_probs = _softmax(
        np.array([crop_logits[key] for key in ordered_keys], dtype=np.float32)
    )
    ranked = np.argsort(crop_probs)[::-1]

    candidates: List[Dict[str, object]] = []
    for local_idx in ranked[:5]:
        crop_key = ordered_keys[int(local_idx)]
        info = PRODUCE_CATALOG[crop_key]
        candidates.append(
            {
                "crop": info["label"],
                "crop_key": crop_key,
                "confidence": round(float(crop_probs[local_idx]), 4),
                "confidence_pct": f"{crop_probs[local_idx] * 100:.1f}%",
                "supported": bool(info["supported"]),
            }
        )

    top_idx = int(ranked[0])
    second_idx = int(ranked[1]) if len(ranked) > 1 else top_idx
    top_key = ordered_keys[top_idx]
    top_info = PRODUCE_CATALOG[top_key]
    top_conf = float(crop_probs[top_idx])
    top_margin = float(crop_probs[top_idx] - crop_probs[second_idx])

    return CropDetection(
        crop_key=top_key,
        crop_name=str(top_info["label"]),
        confidence=top_conf,
        margin=top_margin,
        supported=bool(top_info["supported"]),
        candidates=candidates,
        confident=(
            top_conf >= AUTO_CROP_CONFIDENCE_THRESHOLD
            and top_margin >= AUTO_CROP_MARGIN_THRESHOLD
        ),
    )


# ─── Main prediction function ────────────────────────────────────────────────

def _build_views(img: Image.Image) -> list:
    """
    9 TTA views:
      0  center crop
      1  center + h-flip
      2  center + v-flip
      3  center + both flips
      4  top-left corner
      5  top-right corner
      6  bottom-left corner
      7  bottom-right corner
      8  centre tight-zoom (80 %)
    """
    center = _aspect_center_crop(img, INPUT_SIZE)
    return [
        center,
        center.transpose(Image.FLIP_LEFT_RIGHT),
        center.transpose(Image.FLIP_TOP_BOTTOM),
        center.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.FLIP_TOP_BOTTOM),
        _corner_crop(img, INPUT_SIZE, 0),
        _corner_crop(img, INPUT_SIZE, 1),
        _corner_crop(img, INPUT_SIZE, 2),
        _corner_crop(img, INPUT_SIZE, 3),
        _aspect_tight_crop(img, INPUT_SIZE, zoom=0.80),
    ]




def predict_for_crop(image_bytes: bytes, crop_name: str) -> dict:
    """
    Same TTA pipeline but restricts output to the given crop's classes
    and re-normalises probabilities within that subset.
    """
    crop_key = crop_name.strip().lower()
    indices  = CROP_CLASS_MAP.get(crop_key)
    if not indices:
        raise ValueError(f"Unknown crop '{crop_name}'. Supported: {SUPPORTED_CROPS}")

    extractor, model = get_vit()
    raw  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img  = _auto_contrast(raw)
    views = _build_views(img)

    avg_logits  = _run_vit_batch(extractor, model, views)
    full_probs  = _calibrated_softmax(avg_logits, weights=PRIOR_WEIGHTS)

    subset_probs = full_probs[indices]
    s = subset_probs.sum()
    subset_probs = subset_probs / s if s > 1e-8 else (
        np.ones(len(indices), dtype=np.float32) / len(indices)
    )

    return _finalise(subset_probs, label_indices=indices)


# ---------------------------------------------------------------------------
# Core inference helpers
# ---------------------------------------------------------------------------

def _predict_probs_for_indices(
    img: Image.Image,
    indices: Optional[List[int]] = None,
) -> np.ndarray:
    """Run 9-view TTA through the ViT and return calibrated probabilities.

    If *indices* is provided, the full 38-class probability vector is sliced
    to that subset and re-normalised so probabilities sum to 1.0.  This lets
    the caller focus confidence mass on the target crop's disease classes.
    """
    feature_extractor, vit_model = get_vit()
    tta_views = _build_views(img)
    mean_logits = _run_vit_batch(feature_extractor, vit_model, tta_views)
    full_probs = _calibrated_softmax(mean_logits, weights=PRIOR_WEIGHTS)

    if indices is None:
        return full_probs

    # Slice to crop-specific classes and re-normalise
    subset_probs = full_probs[indices]
    total = subset_probs.sum()
    if total <= 1e-8:  # degenerate case — return uniform distribution
        return np.ones(len(indices), dtype=np.float32) / len(indices)
    return subset_probs / total


def _finalise(
    probs: np.ndarray,
    label_indices: Optional[List[int]] = None,
    *,
    diagnosis_supported: bool = True,
    crop_source: str = "full_scan",
    crop_confidence: float = 1.0,
    advisory: str = "",
    crop_candidates: Optional[List[Dict[str, object]]] = None,
) -> dict:
    sorted_local = np.argsort(probs)[::-1]

    def global_idx(local):
        return label_indices[local] if label_indices else local

    top_local = sorted_local[0]
    second_local = sorted_local[1] if len(sorted_local) > 1 else top_local
    top_idx = global_idx(top_local)
    confidence = float(probs[top_local])
    margin = float(probs[top_local] - probs[second_local])

    info = LABELS.get(
        top_idx,
        {
            "crop": "Unknown",
            "disease": "Unknown",
            "healthy": False,
            "severity": "moderate",
            "treatment": "Consult a local agronomist.",
        },
    )
    sev = info["severity"]
    badge = SEVERITY_BADGE.get(sev, {"label": sev.title(), "color": "#6b7280"})
    uncertain = (confidence < CONFIDENCE_THRESHOLD) or (margin < MARGIN_THRESHOLD)

    top5 = []
    for local_i in sorted_local[:5]:
        g_idx = global_idx(local_i)
        lbl = LABELS.get(int(g_idx), {})
        top5.append({
            "crop": lbl.get("crop", "Unknown"),
            "disease": lbl.get("disease", "Unknown"),
            "confidence_pct": f"{probs[local_i] * 100:.1f}%",
            "confidence": round(float(probs[local_i]), 4),
        })

    return {
        "crop": info["crop"],
        "disease": info["disease"],
        "healthy": info["healthy"],
        "confidence": round(confidence, 4),
        "confidence_pct": f"{confidence * 100:.1f}%",
        "margin": round(margin, 4),
        "severity": sev,
        "severity_label": badge["label"],
        "severity_color": badge["color"],
        "treatment": info["treatment"],
        "uncertain": uncertain,
        "top3": top5[:3],
        "top5": top5,
        "diagnosis_supported": diagnosis_supported,
        "crop_source": crop_source,
        "crop_confidence": round(float(crop_confidence), 4),
        "crop_confidence_pct": f"{crop_confidence * 100:.1f}%",
        "advisory": advisory,
        "crop_candidates": crop_candidates or [],
        "explanation": "",
        "confidence_level": "low",
        "heatmap_url": "",
    }


def _build_unsupported_result(detection: CropDetection) -> dict:
    badge = SEVERITY_BADGE["info"]
    supported_text = ", ".join(SUPPORTED_CROP_LABELS)
    return {
        "crop": detection.crop_name,
        "disease": "Disease diagnosis not available for this crop yet",
        "healthy": False,
        "confidence": round(detection.confidence, 4),
        "confidence_pct": f"{detection.confidence * 100:.1f}%",
        "margin": round(detection.margin, 4),
        "severity": "info",
        "severity_label": badge["label"],
        "severity_color": badge["color"],
        "treatment": "Upload a clear leaf photo from a supported crop, or extend the training set before using this crop for disease diagnosis.",
        "uncertain": True,
        "top3": [],
        "top5": [],
        "diagnosis_supported": False,
        "crop_source": "auto_detected",
        "crop_confidence": round(detection.confidence, 4),
        "crop_confidence_pct": f"{detection.confidence * 100:.1f}%",
        "advisory": f"Recognized as {detection.crop_name}. Disease diagnosis is currently trained for {supported_text}.",
        "crop_candidates": detection.candidates,
        "explanation": "The crop was recognized, but this disease category is not yet supported by the current model.",
        "confidence_level": "low",
        "heatmap_url": "",
    }


def _best_supported_candidate(candidates: List[Dict[str, object]]) -> Optional[Dict[str, object]]:
    for candidate in candidates:
        if candidate["supported"]:
            return candidate
    return None


def predict(image_bytes: bytes) -> dict:
    raw = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = _auto_contrast(raw)
    detection = detect_crop(img)

    if detection.supported and detection.confident:
        indices = CROP_CLASS_MAP[detection.crop_key]
        return _finalise(
            _predict_probs_for_indices(img, indices),
            label_indices=indices,
            crop_source="auto_detected",
            crop_confidence=detection.confidence,
            advisory=f"Crop auto-detected as {detection.crop_name}; diagnosis narrowed to that crop.",
            crop_candidates=detection.candidates,
        )

    supported_candidate = _best_supported_candidate(detection.candidates)
    if supported_candidate:
        supported_conf = float(supported_candidate["confidence"])
        if supported_conf >= AUTO_CROP_CONFIDENCE_THRESHOLD and detection.confidence - supported_conf <= AUTO_CROP_SUPPORTED_DELTA:
            crop_key = str(supported_candidate["crop_key"])
            indices = CROP_CLASS_MAP[crop_key]
            return _finalise(
                _predict_probs_for_indices(img, indices),
                label_indices=indices,
                crop_source="auto_supported_fallback",
                crop_confidence=supported_conf,
                advisory=f"Auto-detection favored {detection.crop_name}, but {supported_candidate['crop']} was the strongest supported crop, so diagnosis was routed there.",
                crop_candidates=detection.candidates,
            )

    if detection.confident and not detection.supported:
        return _build_unsupported_result(detection)

    return _finalise(
        _predict_probs_for_indices(img),
        crop_source="full_scan",
        crop_confidence=detection.confidence,
        advisory=f"Crop auto-detection was uncertain (top guess: {detection.crop_name}), so the model fell back to a full 38-class scan.",
        crop_candidates=detection.candidates,
    )


def predict_for_crop(image_bytes: bytes, crop_name: str) -> dict:
    crop_key = _normalise_crop_name(crop_name)
    indices = CROP_CLASS_MAP.get(crop_key)
    if not indices:
        raise ValueError(f"Unknown crop '{crop_name}'. Supported crops: {', '.join(SUPPORTED_CROP_LABELS)}")

    raw = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = _auto_contrast(raw)
    return _finalise(
        _predict_probs_for_indices(img, indices),
        label_indices=indices,
        crop_source="user_selected",
        crop_confidence=1.0,
        advisory=f"Diagnosis restricted to the selected crop: {PRODUCE_CATALOG[crop_key]['label']}.",
    )


def _confidence_level(confidence: float) -> str:
    if confidence >= 0.85:
        return "high"
    if confidence >= 0.60:
        return "medium"
    return "uncertain"


def _explanation_for_disease(disease_name: str) -> str:
    key = (disease_name or "").strip().lower()
    if key in EXPLANATIONS:
        return EXPLANATIONS[key]
    for template_key, text in EXPLANATIONS.items():
        if template_key in key:
            return text
    return "Detected localized visual anomalies on the leaf that correlate with the predicted disease pattern."


def _generate_lightweight_heatmap(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    rgb = np.array(image)
    hsv = np.array(image.convert("HSV"))
    h = hsv[:, :, 0].astype(np.int16)
    s = hsv[:, :, 1].astype(np.int16)
    v = hsv[:, :, 2].astype(np.int16)

    brown_spots = (((h >= 7) & (h <= 28)) & (s >= 45) & (v <= 190))
    yellowing = (((h >= 20) & (h <= 45)) & (s >= 35) & (v >= 90))
    powdery = ((s <= 32) & (v >= 185))
    dark_lesions = (v <= 65)

    mask = brown_spots | yellowing | powdery | dark_lesions
    overlay = rgb.copy()
    overlay[mask] = np.array([255, 70, 70], dtype=np.uint8)
    blended = ((rgb.astype(np.float32) * 0.67) + (overlay.astype(np.float32) * 0.33)).astype(np.uint8)

    output_name = f"heatmap_{uuid4().hex}.png"
    output_path = os.path.join(GENERATED_DIR, output_name)
    Image.fromarray(blended).save(output_path, format="PNG")
    return f"/static/generated/{output_name}"


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="WAFRA — Crop Disease Diagnosis",
    description="ViT-based plant disease classifier for 38 PlantVillage classes.",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class DiagnosisResult(BaseModel):
    crop:           str
    disease:        str
    healthy:        bool
    confidence:     float
    confidence_pct: str
    margin:         float
    severity:       str
    severity_label: str
    severity_color: str
    treatment:      str
    uncertain:      bool
    top3:           list
    top5:           list
    diagnosis_supported: bool
    crop_source:     str
    crop_confidence: float
    crop_confidence_pct: str
    advisory:       str
    crop_candidates: list
    explanation:    str
    confidence_level: str
    heatmap_url:    str
    processing_ms:  float


@app.post("/diagnose", response_model=DiagnosisResult)
async def diagnose(
    image: UploadFile = File(...),
    crop: Optional[str] = Query(
        default=None,
        description="Restrict diagnosis to a specific supported crop (e.g. 'tomato', 'potato').",
    ),
):
    """Classify a plant leaf or fruit photo and return a disease diagnosis.

    Accepts JPEG, PNG, WebP, HEIC, BMP, and GIF images up to 10 MB.
    React Native on Android may send ``application/octet-stream`` — the
    endpoint falls back to file-extension detection in that case.
    """
    # Accept standard image MIME types plus Android's octet-stream fallback
    ACCEPTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".bmp", ".gif"}
    file_ext = os.path.splitext(image.filename or "")[1].lower()
    content_type = image.content_type or ""
    if not content_type.startswith("image/") and file_ext not in ACCEPTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File must be an image.")

    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB).")

    inference_start = time.perf_counter()
    try:
        result = predict_for_crop(image_bytes, crop) if crop else predict(image_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Inference error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Classification failed. Please try a clearer leaf or fruit photo.",
        )

    result["explanation"] = _explanation_for_disease(result.get("disease", ""))
    result["confidence_level"] = _confidence_level(float(result.get("confidence", 0.0)))
    if bool(result.get("healthy")):
        # For a "Healthy" result, do not generate a red overlay — it confuses users.
        result["heatmap_url"] = ""
    else:
        try:
            result["heatmap_url"] = _generate_lightweight_heatmap(image_bytes)
        except Exception as exc:
            logger.warning("XAI heatmap generation failed: %s", exc)
            result["heatmap_url"] = ""
    result["processing_ms"] = round((time.perf_counter() - inference_start) * 1000, 1)
    return result


@app.get("/crops")
async def list_supported_crops():
    """Return all crops that the ViT model can diagnose diseases for."""
    return {
        "supported_crops": SUPPORTED_CROP_LABELS,
        "recognized_but_unsupported": RECOGNIZED_EXTRA_CROPS,
        "auto_detection_total": len(PRODUCE_CATALOG),
    }


@app.get("/health")
async def health_check():
    """Return service status and loaded model information."""
    try:
        get_vit()
        get_crop_detector()
        return {
            "status": "ready",
            "model":  f"Vision Transformer — {HF_MODEL_ID} (38 classes)",
            "device": str(_device),
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


@app.get("/")
async def serve_frontend():
    """Serve the static web frontend (index.html)."""
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# Static assets (CSS/JS/images) — must be mounted AFTER all explicit GET routes
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
