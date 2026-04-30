"""
WAFRA — وفرة | Agronomic AI Chatbot
=====================================
A multilingual agronomic assistant for Algerian farmers, powered by Groq.

Supported languages
-------------------
- Algerian Darija  (Arabic script & Latin/Arabizi)
- French
- Classical Arabic (فصحى)

API Endpoints
-------------
POST /chat              — LLM chat completion (llama-3.3-70b-versatile)
POST /voice/transcribe  — Speech-to-text   (whisper-large-v3)
POST /voice/speak       — Text-to-speech   (Orpheus Arabic / English)
GET  /health            — Service health check
GET  /                  — Static web frontend

Run
---
    uvicorn main:app --host 0.0.0.0 --port 9000 --reload
"""

import os
import logging
import re
import time
from typing import Any

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi import Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Filesystem paths
# ---------------------------------------------------------------------------
BASE_DIR   = os.path.dirname(__file__)
STATIC_DIR = os.path.join(BASE_DIR, "static")
KB_PATH = os.path.join(BASE_DIR, "kb.json")

# ---------------------------------------------------------------------------
# Groq API configuration
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Chat model
GROQ_CHAT_MODEL = "llama-3.3-70b-versatile"
GROQ_CHAT_URL   = "https://api.groq.com/openai/v1/chat/completions"

# Speech-to-text (Whisper)
GROQ_STT_MODEL = "whisper-large-v3"
GROQ_STT_URL   = "https://api.groq.com/openai/v1/audio/transcriptions"

# Text-to-speech (Orpheus — requires terms acceptance in Groq console)
GROQ_TTS_URL          = "https://api.groq.com/openai/v1/audio/speech"
GROQ_TTS_MODEL_ARABIC = "canopylabs/orpheus-arabic-saudi"
GROQ_TTS_MODEL_ENGLISH = "canopylabs/orpheus-v1-english"
GROQ_TTS_VOICE_ARABIC  = "noura"   # female Arabic voice
GROQ_TTS_VOICE_ENGLISH = "hannah"  # female English voice

# ---------------------------------------------------------------------------
# System prompts — controls WAFRA's persona and language rules
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are WAFRA (وفرة), an expert agronomist AI assistant built exclusively for \
Algerian farmers. You are their 24/7 local agronomist on their phone.

═══ ABSOLUTE LANGUAGE RULE ═══
Detect the dialect/language of each user message:
  → Algerian Darija (Arabic or Latin script) → reply ONLY in Algerian Darija
  → French  → reply ONLY in French
  → Classical Arabic (فصحى) → reply ONLY in Classical Arabic
NEVER switch dialect mid-reply. NEVER drift into Moroccan Darija.

═══ ALGERIAN DARIJA VOCABULARY (mandatory) ═══
Use:   راني, راك, راهو, واش, بصح, شوية, ياسر, بزاف, علاه, وين, اشكون,
       دروك, دوكا, رايح, مليح, من بعد, برك, قاع, مانيش, ماكانش, عاود,
       كيما, كيفاش, نتا, هاك, بكري, تاع, نتاع, نحي, قلع, نقولك, ngoulek

NEVER: دابا, واخا, غادي, فين, ماشي, شنو, ديالي, ديالك, مزيان, بتاع, شيل, متاع, كيداير, زوين, خويا, ngholik

═══ AREAS OF EXPERTISE ═══
1. Disease Diagnosis  — symptoms, leaf color/texture; ask clarifying questions
2. Treatment          — pesticides available at Algerian cooperatives (CCLS, ONAB)
3. Planting Calendars — per wilaya (Biskra, Oran, Blida, Sétif, Annaba …)
4. Irrigation         — drip, furrow, sprinkler; scheduling for arid zones
5. Fertilizer         — NPK, urée, compost; cooperative stock
6. Crops              — طماطم, بطاطا, فليفلة, قمح, شعير, نخيل, زيتون, دلاع …
7. Pest Management    — حلم العنكبوت (red spider mite), mouche blanche, pucerons
8. Soil & Climate     — Saharan, semi-arid, Mediterranean, Tell; sirocco, salinity

═══ RESPONSE STYLE ═══
- Give practical, numbered action steps.
- Start directly with the answer. Do NOT open with filler words like "راني", "بصح", "sah", "rani", or similar opener phrases.
- End every reply with ONE short follow-up question.
- No AI disclaimers — speak like a trusted field expert.
- Emojis welcome in Darija 🌿🌾💧☀️
- Prioritise cheap, locally available solutions.
"""

# Three few-shot conversation examples injected before the user's first message.
# This is the most reliable technique to lock the model into Algerian Darija
# because it learns from concrete examples rather than abstract rules.
DARIJA_FEW_SHOT_EXAMPLES = [
    # Example 1: Arabic-script Darija — tomato disease
    {
        "role": "user",
        "content": "واش راك شيخ؟ أوراق الطماطم ولات صفراء من التحت",
    },
    {
        "role": "assistant",
        "content": (
            "هادا في الغالب mildiou تاع الطماطم. باش تداويه، دير هكذا:\n"
            "1. رش mancéb (مانكوزيب) على الأوراق كل 7 أيام.\n"
            "2. نحي الأوراق المريضة وحرقهم بعيد.\n"
            "3. ما تسقيش بزاف من الفوق — اسقي من التحت برك.\n"
            "واش درت traitement ضد mildiou من قبل ولا هادي المرة الأولى؟ 👌"
        ),
    },
    # Example 2: Latin/Arabizi script — potato disease
    {
        "role": "user",
        "content": "rani 3andi btata wlat smara, wach ndiro?",
    },
    {
        "role": "assistant",
        "content": (
            "hada yebda alternariose wella blight ta3 el btata.\n"
            "1. Dir traitement bel mancéb wella chlorothalonil — roch 3liha kol 7 iyam.\n"
            "2. Nahi el feuilles lmrath, ahreghom b3id 3al champ.\n"
            "3. Chouf les rangs ida el hawa yfout w ma yab9ach mhbous.\n"
            "Wach el btata ta3ek fi plein champ wella taht serra?"
        ),
    },
    # Example 3: French — planting calendar
    {
        "role": "user",
        "content": "Quand est-ce que je dois planter les pommes de terre à Tizi Ouzou ?",
    },
    {
        "role": "assistant",
        "content": (
            "À Tizi Ouzou, la pomme de terre se plante en deux saisons :\n"
            "1. Printemps : de février à mars.\n"
            "2. Automne : de septembre à octobre.\n"
            "Privilégiez des variétés adaptées au climat kabyle comme Spunta ou Diamé. "
            "Disposez-vous de semences certifiées ou allez-vous utiliser des semences locales ?"
        ),
    },
]

# Per-request reminder appended when Darija is detected, preventing dialect drift
# over long conversations (the model can gradually forget early few-shot anchors).
DARIJA_DIALECT_REMINDER = """\
⚠️ DIALECT REMINDER — reply in ALGERIAN Darija only. NO MOROCCAN. NO EGYPTIAN.

Start the reply immediately with the actual advice. Do NOT begin with filler openers like: راني، بصح، صح، sah, rani, aya, ah.

✔ Use:  راني, واش, بصح, دروك, دوكا, رايح, وين, علاه, شوية, بزاف, مليح, برك, مانيش, عاود, تاع, تاعك, نحي, نقولك
✗ Never: دابا, واخا, غادي, فين, ماشي, شنو, ديالي, ديالك, مزيان, بتاع, شيل, زوين, ngholik

Latin/Arabizi: rani, wach, sah, chwiya, bzaf, 3lah, win, drok, douka, rayeh, berk, maniech, 3awed, ta3, ta3ek, nahi, ngoulek
NEVER: daba, wakha, ghadi, fin, machich, chno, dyali, dyalek, mezyan, bta3, chil, zwin, ngholik
"""

# Injected when the user selected English in the UI
ENGLISH_LANGUAGE_PROMPT = """\
LANGUAGE: The user selected English.
Reply ENTIRELY in English — no Arabic, no French, no Darija.
Be practical, warm, and direct, like a local agronomist advising a farmer.\
"""

# Injected when the user selected French in the UI
FRENCH_LANGUAGE_PROMPT = """\
LANGUAGE: The user selected French.
Reply ENTIRELY in French — no Arabic, no English, no Darija.
Be clear and professional, like a trusted Algerian agronomist advising in French.\
"""

# Injected in voice mode to keep replies short and readable aloud
VOICE_MODE_PROMPT = """\
Voice mode active — the user will hear this reply read aloud.
- Keep the reply to 3–5 sentences maximum.
- No markdown, bullet lists, or numbered steps — use natural spoken flow.
- For Darija/Arabic: write in Arabic script (not Latin transliteration).
- French product names are fine when Algerians commonly say them that way.\
"""

# Whisper transcription prompt — anchors the STT model to Algerian Darija
ALGERIAN_TRANSCRIPTION_PROMPT = (
    "The speaker is an Algerian farmer from Algeria (NOT Morocco, NOT Tunisia) "
    "speaking Algerian Darija mixed with Arabic and French. "
    "Transcribe exactly — do NOT translate, do NOT normalise to MSA. "
    "Preserve Algerian particles: واش, علاه, راني, راك, راهو, بصح, شوية, بزاف, "
    "ياسر, من بعد, دروك, وين, اشكون, آش. "
    "Do NOT substitute Moroccan words (دابا, خويا, واخا, فين, شكون, ماشي). "
    "Agriculture terms: tomate, pomme de terre, poivron, mildiou, pucerons, alternariose, "
    "irrigation, semis, engrais, fungicide, insecticide, NPK, urée, mancéb, "
    "Biskra, Sétif, Oran, Blida, Tizi Ouzou, Constantine, Annaba, Batna, Chlef, Adrar, "
    "بطاطا, فليفلة, قمح, شعير, نخيل, زيتون, طماطم, دلاع."
)

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="WAFRA Agronomic Chatbot",
    description="Multilingual AI agronomist for Algerian farmers",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_engine: Any = None


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    """A single turn in the conversation history."""
    role: str     # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Payload for POST /chat."""
    messages: list[ChatMessage]
    voice_mode: bool = False    # true → keep reply short for TTS
    language_hint: str = "auto" # "en" | "fr" | "ar" | "auto"


class ChatResponse(BaseModel):
    """Successful reply from POST /chat."""
    reply: str
    model: str


class SpeechRequest(BaseModel):
    """Payload for POST /voice/speak."""
    text: str
    language_hint: str = "auto"


class TranscriptionResponse(BaseModel):
    """Successful reply from POST /voice/transcribe."""
    text: str
    model: str
    language: str


# ---------------------------------------------------------------------------
# Hyper-local weather + risk (production-oriented, cached)
# ---------------------------------------------------------------------------

class WeatherPoint(BaseModel):
    timestamp: int
    temp: float
    humidity: int
    rain: float = 0.0
    wind: float = 0.0


class WeatherResponse(BaseModel):
    lat: float
    lon: float
    temp: float
    humidity: int
    rain: float
    forecast: list[WeatherPoint]
    cached: bool


class RiskItem(BaseModel):
    type: str
    level: str
    confidence: float


class RiskResponse(BaseModel):
    crop: str
    risks: list[RiskItem]
    message: str
    expected_within_48h: bool
    timeline: str


class RiskRequest(BaseModel):
    crop: str
    weather: dict


WEATHER_TTL_SECONDS = 60 * 60  # 1 hour
_weather_cache: dict[str, tuple[float, dict]] = {}


def _weather_cache_key(lat: float, lon: float) -> str:
    # Round to keep cache reasonable while staying hyper-local.
    return f"weather_{round(lat, 2)}_{round(lon, 2)}"


def _get_openweather_key() -> str:
    return (os.getenv("OPENWEATHER_API_KEY") or "").strip()


async def _fetch_openweather_forecast(lat: float, lon: float) -> dict:
    key = _get_openweather_key()
    if not key:
        raise HTTPException(status_code=400, detail="Missing OPENWEATHER_API_KEY on backend.")
    url = (
        "https://api.openweathermap.org/data/2.5/forecast"
        f"?lat={lat}&lon={lon}&units=metric&appid={key}"
    )
    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.get(url)
        if not res.is_success:
            raise HTTPException(status_code=502, detail="Could not fetch weather forecast.")
        return res.json()


def _map_weather(data: dict) -> tuple[dict, list[dict]]:
    entries = data.get("list") or []
    mapped: list[dict] = []
    for item in entries[:16]:
        dt = int(item.get("dt") or int(time.time()))
        main = item.get("main") or {}
        rain = item.get("rain") or {}
        wind = item.get("wind") or {}
        mapped.append(
            {
                "timestamp": dt,
                "temp": float(main.get("temp") or 24.0),
                "humidity": int(main.get("humidity") or 65),
                "rain": float(rain.get("3h") or 0.0),
                "wind": float(wind.get("speed") or 0.0),
            }
        )
    current = mapped[0] if mapped else {"timestamp": int(time.time()), "temp": 24.0, "humidity": 65, "rain": 0.0, "wind": 0.0}
    forecast = mapped[1:] if len(mapped) > 1 else []
    return current, forecast


@app.get("/weather", response_model=WeatherResponse)
async def get_weather(lat: float = Query(...), lon: float = Query(...)):
    cache_key = _weather_cache_key(lat, lon)
    now = time.time()
    cached_item = _weather_cache.get(cache_key)
    if cached_item and (now - cached_item[0]) < WEATHER_TTL_SECONDS:
        payload = cached_item[1]
        return {**payload, "cached": True}

    try:
        raw = await _fetch_openweather_forecast(lat, lon)
        current, forecast = _map_weather(raw)
        payload = {
            "lat": float(lat),
            "lon": float(lon),
            "temp": float(current.get("temp", 24.0)),
            "humidity": int(current.get("humidity", 65)),
            "rain": float(current.get("rain", 0.0)),
            "forecast": forecast,
        }
        _weather_cache[cache_key] = (now, payload)
        return {**payload, "cached": False}
    except HTTPException:
        # Let FastAPI handle structured error responses.
        raise
    except Exception as err:
        logger.exception("Weather endpoint failed")
        # Do not fail the app: return a safe fallback payload.
        fallback = {
            "lat": float(lat),
            "lon": float(lon),
            "temp": 24.0,
            "humidity": 65,
            "rain": 0.0,
            "forecast": [],
        }
        _weather_cache[cache_key] = (now, fallback)
        return {**fallback, "cached": False}


RISK_RULES = [
    {
        "name": "fungal",
        "level": "high",
        "confidence": 0.8,
        "conditions": lambda w: (w.get("humidity", 0) > 80) and (18 <= w.get("temp", 0) <= 28),
        "message": "High humidity with moderate temperatures increases fungal disease risk (mildew/blight).",
    },
    {
        "name": "bacterial",
        "level": "medium",
        "confidence": 0.7,
        "conditions": lambda w: (w.get("rain", 0) > 5) and (w.get("humidity", 0) > 70),
        "message": "Rain plus humidity increases bacterial disease pressure (splash transmission).",
    },
    {
        "name": "heat_stress",
        "level": "high",
        "confidence": 0.75,
        "conditions": lambda w: (w.get("temp", 0) > 35),
        "message": "High temperature can cause heat stress—tighten irrigation and shade/ventilation.",
    },
]


def _evaluate_risks(weather_now: dict) -> list[RiskItem]:
    hits: list[RiskItem] = []
    for rule in RISK_RULES:
        try:
            if rule["conditions"](weather_now):
                hits.append(
                    RiskItem(type=rule["name"], level=rule["level"], confidence=float(rule["confidence"]))
                )
        except Exception:
            continue
    return hits


def _risk_message(risks: list[RiskItem]) -> str:
    if not risks:
        return "Low disease pressure right now. Keep routine scouting every 2-3 days."
    primary = risks[0].type
    rule = next((r for r in RISK_RULES if r["name"] == primary), None)
    return rule["message"] if rule else "Disease risk detected based on local conditions."


@app.post("/risk", response_model=RiskResponse)
async def compute_risk(payload: RiskRequest):
    weather = payload.weather or {}
    forecast = weather.get("forecast") or []
    weather_now = {
        "temp": weather.get("temp"),
        "humidity": weather.get("humidity"),
        "rain": weather.get("rain", 0),
        "wind": weather.get("wind", 0),
    }

    now_risks = _evaluate_risks(weather_now)
    future_hits = False
    for point in forecast:
        point_norm = {
            "temp": point.get("temp"),
            "humidity": point.get("humidity"),
            "rain": point.get("rain", 0),
            "wind": point.get("wind", 0),
        }
        if _evaluate_risks(point_norm):
            future_hits = True
            break

    timeline = "Risk expected within 24-48h" if future_hits else "No major risk expected in next 48h"
    return RiskResponse(
        crop=payload.crop,
        risks=now_risks,
        message=_risk_message(now_risks),
        expected_within_48h=future_hits,
        timeline=timeline,
    )


@app.post("/alerts")
async def build_alerts(payload: RiskRequest):
    risk = await compute_risk(payload)
    if not risk.risks and not risk.expected_within_48h:
        return {"alerts": []}
    alerts = []
    if risk.risks:
        top = risk.risks[0]
        alerts.append(f"⚠️ {top.level.title()} risk: {top.type.replace('_',' ')}")
    if risk.expected_within_48h:
        alerts.append("⏳ Risk increasing in the next 24–48h based on forecast.")
    alerts.append(risk.message)
    return {"alerts": alerts, "timeline": risk.timeline}

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def resolve_api_key() -> str:
    """Return the API key from the environment.
    Raises HTTPException(400) if no key is found.
    """
    resolved = GROQ_API_KEY
    if not resolved:
        raise HTTPException(
            status_code=400,
            detail="Groq API key required. Set GROQ_API_KEY env var.",
        )
    return resolved


def contains_arabic_script(text: str) -> bool:
    """Return True if *text* contains any Arabic-script character."""
    return bool(re.search(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]", text or ""))


def normalise_language_code(hint: str, fallback_text: str = "") -> str:
    """Map a loose language hint to a canonical code: 'ar', 'fr', or 'en'.

    Detection order:
    1. Explicit hint string ("ar", "darija", "ar-dz", "fr", "fr-dz", "en", …)
    2. Arabic script detected in *fallback_text*
    3. Default → 'fr' (most common second language for Algerian farmers)
    """
    hint = (hint or "auto").lower()
    if hint in {"ar", "darija", "ar-dz"}:
        return "ar"
    if hint.startswith("fr"):
        return "fr"
    if hint.startswith("en"):
        return "en"
    if contains_arabic_script(fallback_text):
        return "ar"
    return "fr"


def strip_markdown_for_tts(text: str) -> str:
    """Remove markdown syntax from *text* before sending to TTS.

    Strips: code blocks, bold/italic markers, headings, blockquotes,
    list numbers, and excess whitespace. Truncates to 1 200 characters
    (Orpheus model limit).
    """
    cleaned = (text or "").strip()
    cleaned = re.sub(r"`{1,3}.*?`{1,3}", " ", cleaned, flags=re.DOTALL)  # code blocks
    cleaned = re.sub(r"[*_#>-]", " ", cleaned)                           # markers
    cleaned = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1", cleaned)              # links
    cleaned = re.sub(r"\b\d+\.\s*", " ", cleaned)                        # numbered lists
    cleaned = re.sub(r"\s+", " ", cleaned)                               # normalise whitespace
    return cleaned[:1200].strip()


def strip_filler_openers(text: str, language: str) -> str:
    """Remove filler openings like 'rani' or 'bsah' from reply starts."""
    cleaned = (text or "").strip()
    if not cleaned or language != "ar":
        return cleaned

    patterns = [
        r"^(?:راني|بصح|صح|آيا|ايا)\s*[،,:!\-–—]*\s*",
        r"^(?:rani|bsah|bsa7|sah|aya|ah)\s*[،,:!\-–—]*\s*",
    ]

    previous = None
    while cleaned and cleaned != previous:
        previous = cleaned
        for pattern in patterns:
            cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE).strip()

    return cleaned


def sanitize_reply_for_language(text: str, language: str) -> str:
    """Remove script noise that does not belong to the target language."""
    cleaned = (text or "").strip()
    if not cleaned:
        return cleaned

    # Keep Arabic, Latin, numbers, whitespace, and common punctuation for Darija.
    if language == "ar":
        cleaned = re.sub(r"[^\u0600-\u06FFA-Za-z0-9\s\.,;:!?\-\(\)\[\]{}'\"/%+&@#*_=<>،؛؟]", " ", cleaned)
    # For French/English, keep Latin script + accents and common punctuation.
    elif language in {"fr", "en"}:
        cleaned = re.sub(r"[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s\.,;:!?\-\(\)\[\]{}'\"/%+&@#*_=<>]", " ", cleaned)

    # Normalize spacing after character filtering.
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


DIALECT_FORBIDDEN = ["دابا", "واخا", "غادي", "فين", "شنو", "ديالي", "ديالك", "مزيان", "خويا"]
DIALECT_FIXES = {
    "دابا": "دروك",
    "واخا": "بصح",
    "غادي": "رايح",
    "فين": "وين",
    "شنو": "واش",
    "ديالي": "تاعي",
    "ديالك": "تاعك",
    "مزيان": "مليح",
    "خويا": "صاحبي",
}


def has_wrong_dialect(text: str) -> bool:
    return any(word in (text or "") for word in DIALECT_FORBIDDEN)


def patch_wrong_dialect(text: str) -> str:
    patched = text or ""
    for bad, good in DIALECT_FIXES.items():
        patched = patched.replace(bad, good)
    return patched


def should_force_clarification(user_message: str) -> bool:
    lowered = (user_message or "").lower()
    disease_markers = [
        "مرض",
        "مشكلة",
        "symptom",
        "symptome",
        "disease",
        "maladie",
        "mildiou",
        "blight",
    ]
    return any(marker in lowered for marker in disease_markers) and len(lowered.split()) < 5


def is_grounded(reply: str, context: str) -> bool:
    if not context.strip():
        return True
    ctx_words = set(re.findall(r"\w+", context.lower()))
    reply_words = re.findall(r"\w+", (reply or "").lower())
    overlap = sum(1 for word in reply_words if word in ctx_words)
    return overlap > 8


def clarification_fallback(language: str) -> str:
    if language == "fr":
        return "Je peux t'aider, mais il me faut plus de details: quels symptomes exacts vois-tu sur les feuilles et depuis combien de jours?"
    if language == "ar":
        return "نقدر نعاونك، بصح لازم تفاصيل اكثر: واش هي الاعراض بالضبط في الاوراق، ومن شحال هادي بانت؟"
    return "I can help, but I need more details first: what exact symptoms do you see on the leaves, and for how many days?"


def detect_message_language(request: ChatRequest) -> str:
    """Detect the language of the user's latest message based on its content.
    Returns 'ar' (Darija/Arabic), 'fr' (French), 'en' (English), or 'auto' (fallback).
    """
    last_user_message = next(
        (m.content for m in reversed(request.messages) if m.role == "user"), ""
    ).lower()

    if not last_user_message:
        return (request.language_hint or "auto").lower()

    # 1. Arabic script strongly implies Arabic/Darija
    if contains_arabic_script(last_user_message):
        return "ar"

    # 2. Arabizi (Latin-script Darija) markers
    arabizi_markers = [
        "rani", "wach", "bsah", "sah", "3lah", "chwiya", "bzaf", "yasr",
        "drok", "rayeh", "mlich", "win ", "berk", "qa3", "maniech", "ach ",
        "roh", "dir ", "3awed", "hak", "bkri", "ntya", "nta ", "chkon"
    ]
    if any(marker in last_user_message for marker in arabizi_markers):
        return "ar"
        
    # 3. French markers
    french_markers = [
        " comment ", " est ", " le ", " la ", " les ", " un ", " une ", " des ",
        " pour ", " quoi ", " qui ", " quand ", " où ", " pourquoi ",
        " tomate", " pomme de terre", " maladie", " eau ", " bonjour", " salut", " merci"
    ]
    # Check if words start with or match these markers
    if any(re.search(rf"\b{m.strip()}\b", last_user_message) for m in french_markers):
        return "fr"
        
    # 4. English markers
    english_markers = [
        " how ", " what ", " why ", " when ", " where ", " who ", " is ", " are ",
        " do ", " does ", " can ", " water ", " soil ", " crop", " plant",
        " hello", " hi ", " thanks", " please"
    ]
    if any(re.search(rf"\b{m.strip()}\b", last_user_message) for m in english_markers):
        return "en"

    # 5. Fallback to the UI hint
    hint = (request.language_hint or "auto").lower()
    if hint.startswith("fr"): return "fr"
    if hint.startswith("en"): return "en"
    if hint in {"ar", "darija", "ar-dz"}: return "ar"
    
    return "fr" # Default fallback


def build_system_messages(request: ChatRequest) -> list[dict[str, str]]:
    """Assemble the ordered list of system messages sent to the LLM.

    Strategy:
    - Always inject the base SYSTEM_PROMPT first.
    - Detect the actual language of the user's message to override hints if necessary.
    - For Darija: inject few-shot examples (dialect anchoring) + reminder.
    - For EN/FR: inject a concise language-enforcement prompt.
    - In voice mode: append a brevity prompt so replies are readable aloud.
    """
    system_messages: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

    detected_lang = detect_message_language(request)

    if detected_lang == "fr":
        system_messages.append({"role": "system", "content": FRENCH_LANGUAGE_PROMPT})
    elif detected_lang == "en":
        system_messages.append({"role": "system", "content": ENGLISH_LANGUAGE_PROMPT})
    elif detected_lang == "ar":
        # Few-shot examples are the most reliable dialect anchor —
        # the model calibrates from concrete evidence, not abstract rules.
        system_messages.extend(DARIJA_FEW_SHOT_EXAMPLES)
        system_messages.append({"role": "system", "content": DARIJA_DIALECT_REMINDER})

    if request.voice_mode:
        system_messages.append({"role": "system", "content": VOICE_MODE_PROMPT})

    return system_messages


# ---------------------------------------------------------------------------
# Route helpers
# ---------------------------------------------------------------------------

def _extract_groq_error(exc: httpx.HTTPStatusError, fallback: str) -> str:
    """Pull the human-readable message out of a Groq API error response."""
    try:
        return exc.response.json().get("error", {}).get("message", fallback)
    except Exception:
        return fallback


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """Send the conversation to the Groq LLM and return the assistant reply.

    The last 20 turns of history are forwarded to stay within the context
    window while keeping costs low.
    """
    api_key = resolve_api_key()
    detected_lang = detect_message_language(request)
    last_user_message = next(
        (m.content for m in reversed(request.messages) if m.role == "user"),
        "",
    )
    retrieval_context = ""

    # Build the full message list: [system prompts…] + [conversation history]
    messages = build_system_messages(request)
    if rag_engine is not None and last_user_message:
        try:
            retrieval = rag_engine.hybrid_retrieve(last_user_message, k=5)
            retrieval_context = retrieval.context
            messages.insert(
                1,
                {
                    "role": "system",
                    "content": f"""You are an Algerian agronomist.

Use ONLY the context below.

CONTEXT:
{retrieval_context}

RULES:
- No hallucination
- If unsure -> ask 1-2 clarification questions
- If symptoms are incomplete, ask for details before treatment
- Prefer simple, local solutions
""",
                },
            )
        except Exception as err:
            logger.warning("RAG retrieval skipped: %s", err)

    for turn in request.messages[-20:]:
        messages.append({"role": turn.role, "content": turn.content})

    payload = {
        "model": GROQ_CHAT_MODEL,
        "messages": messages,
        "temperature": 0.4,   # low randomness for factual agronomic advice
        "max_tokens": 1024,
        "top_p": 0.9,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_CHAT_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("Groq chat API error: %s", exc.response.text)
        raise HTTPException(
            status_code=502,
            detail=_extract_groq_error(exc, "Groq API error"),
        )
    except httpx.RequestError as exc:
        logger.error("Groq chat network error: %s", exc)
        raise HTTPException(status_code=503, detail="Could not reach Groq API.")

    reply_text = data["choices"][0]["message"]["content"]
    reply_text = strip_filler_openers(reply_text, detected_lang)
    reply_text = sanitize_reply_for_language(reply_text, detected_lang)
    if detected_lang == "ar":
        reply_text = patch_wrong_dialect(reply_text)
    if retrieval_context and should_force_clarification(last_user_message) and not is_grounded(reply_text, retrieval_context):
        reply_text = clarification_fallback(detected_lang)
    if detected_lang == "ar" and has_wrong_dialect(reply_text):
        reply_text = patch_wrong_dialect(reply_text)
    return {"reply": reply_text, "model": GROQ_CHAT_MODEL}


@app.post("/voice/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language_hint: str = Form("auto"),
):
    """Transcribe uploaded audio using Whisper via Groq.

    When the UI is set to "ar" or "fr", that language is passed explicitly
    to Whisper so dialect-specific vocabulary is preserved.
    When the UI is set to "en" (the default) or "auto", Whisper is allowed
    to auto-detect the spoken language so Arabic speech is always recognised
    correctly regardless of the UI language selection.
    """
    resolved_key = resolve_api_key()
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio upload.")

    canonical_hint = normalise_language_code(language_hint)

    # Use Whisper auto-detection when the UI hint is English (the UI default)
    # or auto, so Arabic / Darija speech is never misidentified as English.
    force_language: str | None = canonical_hint if canonical_hint in {"ar", "fr"} else None

    # Always inject the Algerian prompt to anchor Whisper to local vocabulary.
    transcription_prompt = ALGERIAN_TRANSCRIPTION_PROMPT

    whisper_data: dict = {
        "model": GROQ_STT_MODEL,
        "prompt": transcription_prompt,
        "response_format": "verbose_json",  # includes detected language field
        "temperature": "0",
    }
    if force_language:
        whisper_data["language"] = force_language

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                GROQ_STT_URL,
                headers={"Authorization": f"Bearer {resolved_key}"},
                data=whisper_data,
                files={
                    "file": (
                        file.filename or "recording.m4a",
                        audio_bytes,
                        file.content_type or "audio/mp4",
                    )
                },
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("Groq STT API error: %s", exc.response.text)
        raise HTTPException(
            status_code=502,
            detail=_extract_groq_error(exc, "Speech-to-text error"),
        )
    except httpx.RequestError as exc:
        logger.error("Groq STT network error: %s", exc)
        raise HTTPException(status_code=503, detail="Could not reach Groq STT service.")

    transcript = (data.get("text") or "").strip()
    if not transcript:
        raise HTTPException(status_code=422, detail="No speech detected in the recording.")

    # verbose_json includes a "language" field with the detected ISO-639-1 code.
    detected_language = (data.get("language") or force_language or "fr").strip().lower()
    # Normalise to our canonical codes.
    if detected_language in {"arabic", "ar"}:
        detected_language = "ar"
    elif detected_language.startswith("fr"):
        detected_language = "fr"
    elif detected_language.startswith("en"):
        detected_language = "en"

    return {"text": transcript, "model": GROQ_STT_MODEL, "language": detected_language}


@app.post("/voice/speak")
async def synthesise_speech(request: SpeechRequest):
    """Convert text to speech using the Groq Orpheus TTS models.

    Model selection:
    - Arabic/Darija → canopylabs/orpheus-arabic-saudi  (voice: noura)
    - English/French → canopylabs/orpheus-v1-english   (voice: hannah)

    Returns raw WAV audio bytes with Content-Type: audio/wav.

    Note: Both Orpheus models require terms acceptance in the Groq console
    before use: https://console.groq.com/playground?model=<model-id>
    """
    api_key = resolve_api_key()
    clean_text = strip_markdown_for_tts(request.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="No text provided for speech synthesis.")

    language = normalise_language_code(request.language_hint, request.text)
    tts_model = GROQ_TTS_MODEL_ARABIC  if language == "ar" else GROQ_TTS_MODEL_ENGLISH
    tts_voice = GROQ_TTS_VOICE_ARABIC  if language == "ar" else GROQ_TTS_VOICE_ENGLISH

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GROQ_TTS_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": tts_model,
                    "voice": tts_voice,
                    "input": clean_text,
                    "response_format": "wav",
                },
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.error("Groq TTS API error: %s", exc.response.text)
        raise HTTPException(
            status_code=502,
            detail=_extract_groq_error(exc, "Text-to-speech error"),
        )
    except httpx.RequestError as exc:
        logger.error("Groq TTS network error: %s", exc)
        raise HTTPException(status_code=503, detail="Could not reach Groq TTS service.")

    return Response(content=response.content, media_type="audio/wav")


@app.get("/health")
async def health_check():
    """Return service status and model configuration."""
    return {
        "status": "ready",
        "service": "WAFRA Agronomic Chatbot",
        "models": {
            "chat":      GROQ_CHAT_MODEL,
            "stt":       GROQ_STT_MODEL,
            "tts_arabic": GROQ_TTS_MODEL_ARABIC,
            "tts_english": GROQ_TTS_MODEL_ENGLISH,
        },
    }


@app.get("/")
async def serve_frontend():
    """Serve the static web frontend (index.html)."""
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# Serve CSS/JS/image assets under /static
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.on_event("startup")
async def startup_load_rag():
    global rag_engine
    if not os.path.exists(KB_PATH):
        logger.warning("RAG disabled: kb.json not found at %s", KB_PATH)
        return
    try:
        from rag_engine import RagEngine

        rag_engine = RagEngine(base_dir=BASE_DIR)
        logger.info("RAG engine initialized with %s docs", len(rag_engine.docs))
    except Exception as err:
        rag_engine = None
        logger.warning("RAG disabled due to initialization error: %s", err)
