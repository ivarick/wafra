# NABTA — نبتة | Algerian Agronomic Assistant

NABTA is a comprehensive agronomic application ecosystem designed explicitly for Algerian farmers. It leverages state-of-the-art artificial intelligence models for both crop disease diagnosis and a conversational agronomy assistant fluent in Algerian Darija.

Built with **Expo (React Native)** for the frontend and **FastAPI / Django** for its backend microservices, NABTA brings production-grade AI directly to the field.

---

## 📂 Path Guide & Project Structure

The project is structured into a modular monorepo containing the mobile application, web fallbacks, and backend microservices.

```text
green/
├── app/                  # Expo Router App Directory (Mobile Frontend Pages)
│   ├── (tabs)/           # Tabbed navigation screens (Home, Chat, Profile)
│   ├── diagnosis.tsx     # Disease Diagnosis Interface
│   ├── login.tsx         # User Authentication Flow
│   ├── sheet/            # Crop-specific detailed pages
│   └── _layout.tsx       # Root layout and global providers
├── components/           # Reusable UI Components
│   ├── auth/             # Login sub-components (CapsuleToggle, OtpInput)
│   ├── VoiceOverlay.tsx  # Interactive voice recording UI with animations
│   └── TypingIndicator.tsx
├── constants/            # Global Constants
│   ├── colors.ts         # App design system and color tokens
│   ├── crops.ts          # Crop metadata and static registries
│   └── i18n.ts           # Localization strings and types
├── domain/               # Domain Layer (Clean Architecture)
│   ├── entities/         # Core business models (Crop.ts, ChatMessage.ts)
│   ├── repositories/     # Repository interfaces (ICropRepository, IAuthRepository)
│   └── usecases/         # Application business logic (LoginWithEmail, RequestOtp)
├── data/                 # Data Layer (Clean Architecture)
│   ├── repositories/     # Concrete implementations of repositories
│   └── sources/          # External API clients (axiosInstance)
├── hooks/                # Custom React Hooks (useAuth, useNetwork)
├── utils/                # Utility scripts (platform-safe storage wrapper)
│
├── backend/              # 🏛️ Core Django Application Backend
│   ├── core/             # Django project configuration (formerly Hack_Backend)
│   ├── auth/             # Custom user and authentication logic
│   ├── crops/            # Crop management and database models
│   ├── journal/          # Farmer field journal endpoints
│   └── reports/          # Agronomic reporting generation
│
├── chatbot/              # 🤖 Agronomy Chatbot Microservice (FastAPI)
│   ├── main.py           # Core conversational AI and TTS/STT pipelines
│   └── static/           # Standalone web interface for the chatbot
│
├── disease/              # 🌿 Crop Disease Diagnosis Microservice (FastAPI)
│   ├── main.py           # ViT disease classification and CLIP crop detection
│   └── model/            # Downloaded HuggingFace model cache directory
│
├── calc/                 # Standalone web-based agricultural calculator
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── offline/              # Fallback offline client (formerly nabta_offline)
├── fact_sheets/          # Agronomic crop documentation (formerly crop_fact_sheets)
└── scripts/              # Useful maintenance scripts (e.g., patch_chat.py)
```

---

## 🏛️ Technical Architecture

The NABTA architecture emphasizes strict separation of concerns across its stack.

### 1. Frontend (Mobile App)
Built on **Expo Router**, the frontend implements **Clean Architecture**. Business logic is strictly decoupled from UI components.
- **Presentation Layer**: React components located in `app/` and `components/`. They dispatch commands to hooks.
- **Domain Layer**: `domain/usecases` encapsulates the pure business rules. `domain/entities` holds TypeScript interfaces like `Crop` and `ChatMessage`.
- **Data Layer**: `data/repositories` communicates with the backend, securely storing tokens via a platform-aware storage wrapper to support both mobile (`expo-secure-store`) and web (`localStorage`).

### 2. Core Backend (`/backend`)
A standard **Django** monolithic service providing REST APIs for authentication, crop sheets, user journals, and generic data persistence via SQLite/PostgreSQL. It handles standard CRUD operations separately from the AI models.

### 3. Agronomy Chatbot Microservice (`/chatbot`)
A separate **FastAPI** service wrapping the Groq API for rapid AI inference.
- **LLM**: `llama-3.3-70b-versatile` handles reasoning and conversational flows.
- **Speech-to-Text (STT)**: `whisper-large-v3` accurately parses audio from the user's mobile device into text.
- **Text-to-Speech (TTS)**: Leverages `canopylabs/orpheus-arabic-saudi` to generate high-fidelity, natural-sounding audio responses.

### 4. Crop Disease Diagnosis Microservice (`/disease`)
A specialized **FastAPI** service focusing on computer vision tasks.
- **Crop Detection**: `openai/clip-vit-base-patch32` performs zero-shot detection to identify the crop type.
- **Disease Classification**: `hussesey/vit-plantdisease` (Vision Transformer) diagnoses diseases across 38 specific crop-disease classes.

---

## 🧠 Deep Dive: AI Robustness & Implementation

The AI implementation in NABTA is highly specialized for the Algerian agricultural context. 

### 1. Dialect Anchoring and LLM Prompting
To prevent the LLM from drifting into Moroccan Darija or Classical Arabic (MSA), we use a multi-tiered prompting strategy:
- **System Prompt Restrictions**: Hard bans on Moroccan terms (e.g., *daba*, *khoya*) and strict reinforcement of Algerian terms (e.g., *rani*, *wach*, *drok*).
- **Few-Shot Injecting**: We pre-inject simulated conversation turns that perfectly capture Algerian Darija in both Arabic script and Latin/Arabizi. This gives the model a concrete conversational anchor.
- **Per-Turn Reminders**: A concise `DARIJA_DIALECT_REMINDER` is appended to the system prompts whenever the user inputs Darija, ensuring the model's context window doesn't "forget" the dialect constraints over long conversations.

### 2. Context-Aware Whisper Transcriptions
Transcribing Algerian Darija is exceptionally difficult due to the mix of Arabic, French loan words, and regional slang. 
- We inject a highly specific **Whisper Transcription Prompt** (`ALGERIAN_TRANSCRIPTION_PROMPT`) explicitly instructing the STT model to expect a blend of languages and providing localized agricultural vocabulary (e.g., *mildiou*, *urée*, *pucerons*, *طماطم*).

### 3. Robust Vision Transformers (ViT) with Auto-Detection
The image classification pipeline is hardened against real-world field conditions (poor lighting, shaky hands, bad angles).
- **Zero-Shot CLIP Auto-Detection**: Before classifying the disease, the pipeline uses CLIP to automatically detect the crop type. If the user uploads a tomato, the model dynamically filters the ViT's output to only consider tomato-related diseases. This prevents impossible diagnoses (e.g., diagnosing "Apple Scab" on a Corn leaf).
- **Dynamic Histogram Equalization**: The pipeline automatically stretches the contrast of incoming images, rescuing over-exposed or under-exposed photos taken in harsh sunlight.
- **Test-Time Augmentation (TTA)**: Instead of passing the image to the ViT once, the pipeline passes **9 different augmented views** (center crops, corner crops, flipped versions, tight zooms) in a single batch. The logits are averaged to produce a highly stabilized and confident final prediction.

### 4. Calibrated Softmax and Prior Weights
Since the `PlantVillage` dataset is heavily unbalanced (e.g., 5,000 images of one disease, 150 of another), the raw model predictions are naturally biased. We apply **Prior Class Weighting** using the exact distribution counts of the training data. This mathematically corrects the softmax outputs, ensuring rare diseases are detected just as reliably as common ones.

---

## 🚀 Getting Started

### Running the Mobile App
1. Install dependencies: `npm install`
2. Configure `.env` with:
   - `EXPO_PUBLIC_API_BASE_URL` (points to the Django or Disease API)
   - `EXPO_PUBLIC_CHATBOT_URL` (points to the Chatbot API)
3. Start Expo: `npx expo start`

### Running the Microservices
*Python 3.10+ required.*

If you cloned this repo from GitHub, the virtual environments are not included. Create them first:

```powershell
.\setup_venvs.ps1
```

**Django Backend:**
```bash
cd backend
python manage.py migrate
python manage.py runserver 8080
```

**Chatbot API:**
```bash
cd chatbot
pip install fastapi uvicorn httpx pydantic
export GROQ_API_KEY="your-key-here"
uvicorn main:app --host 0.0.0.0 --port 9000 --reload
```

**Disease API:**
```bash
cd disease
pip install fastapi uvicorn torch torchvision transformers pillow numpy python-multipart
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*(Note: The `disease` microservice will download roughly 1.5GB of model weights on its first launch.)*

On Windows PowerShell, activate the local venvs with:

```powershell
.\chatbot\.venv\Scripts\Activate.ps1
.\disease\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

To start the two FastAPI services with the correct paths for this repo:

```powershell
.\start_green.ps1
```
