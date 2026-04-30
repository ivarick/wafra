# WAFRA Complete Features Documentation

This document catalogs the implemented features across the `namaa` workspace, including frontend, backend, AI services, offline stack, and supporting product modules.

It is built from the current codebase and is intended as a living source of truth.

## 1) Product Feature Matrix (High Level)

- **Mobile App (Expo):** onboarding, auth, home dashboard, chat, voice input, diagnosis capture, sheets, map, reports export, calculator, journal, gallery, account/settings/FAQ.
- **Core Backend (Django):** auth lifecycle, profile management, locator centers, journal logs + weather alerts, community gallery APIs, report generation/listing/preview, calculator status API.
- **Chatbot Service (FastAPI):** multilingual agronomy chat, Darija dialect control, STT, TTS, RAG retrieval, health diagnostics, web UI fallback.
- **Disease Service (FastAPI):** crop disease diagnosis from image, crop auto-detection, confidence/ranking output, health diagnostics, web UI fallback, lightweight XAI overlay + explanation.
- **Offline Subsystem:** offline content sync API, local SQLite cache, searchable crops/diseases, reconnect sync behavior, offline UI badges/banners.
- **Support Modules:** standalone web calculator, structured agronomy fact-sheet dataset, setup/start scripts.

---

## 2) Frontend Features (Expo App)

## 2.1 App shell and global behavior

### Feature: Global app shell and providers
- **What it does:** initializes app-level providers for auth, language, query caching, gesture handling, and offline state UI.
- **Files:**
  - `app/_layout.tsx`
  - `components/OfflineBanner.tsx`
  - `hooks/useAuth.tsx`
  - `hooks/useAppLanguage.tsx`
  - `hooks/useNetwork.ts`

### Feature: Launch routing gate
- **What it does:** redirects users at startup to onboarding or home based on session state.
- **File:** `app/index.tsx`

### Feature: Tab navigation and quick-action center button
- **What it does:** drives Home / Sheets / Map tabs with dedicated quick actions for Chat and Scan.
- **File:** `app/(tabs)/_layout.tsx`

## 2.2 Onboarding and authentication UX

### Feature: Onboarding
- **What it does:** first-run onboarding and persistence of seen state.
- **File:** `app/onboarding.tsx`

### Feature: Login (email/password)
- **What it does:** authenticates with backend, persists tokens, updates global auth state.
- **Files:**
  - `app/login.tsx`
  - `hooks/useAuth.tsx`
  - `data/repositories/AuthRepository.ts`
  - `data/sources/axiosInstance.ts`

### Feature: Phone OTP login UI (partially implemented)
- **What it does:** OTP request/verify flow in UI; backend wiring currently stubbed in repository methods.
- **Files:**
  - `app/login.tsx`
  - `components/auth/OtpInput.tsx`
  - `data/repositories/AuthRepository.ts`

### Feature: Google login (mock flow in app)
- **What it does:** provides UI path and local/mock user session in current app hook flow.
- **Files:**
  - `app/login.tsx`
  - `hooks/useAuth.tsx`

### Feature: Forgot password screen
- **What it does:** password-reset request UX shell.
- **Files:**
  - `app/forgotPass.tsx`
  - `app/login.tsx` (embedded forgot state flow)

## 2.3 Home, sheets, map, diagnosis, reports

### Feature: Home dashboard
- **What it does:** multilingual landing UI, search/filter over crop categories, side drawer shortcuts, hyper-local disease risk card driven by backend weather + rules (forecast intelligence).
- **File:** `app/(tabs)/home.tsx`
- **Dependency:** chatbot service endpoints (`/weather`, `/risk`) via `utils/chatbotApi.ts`

### Feature: Crop sheets list and details
- **What it does:** browse/search crop cards and open detailed crop agronomy pages.
- **Files:**
  - `app/(tabs)/sheets.tsx`
  - `app/sheets.tsx`
  - `app/sheet/[id].tsx`
  - `constants/crops.ts`

### Feature: Aid center map
- **What it does:** map visualization for aid centers and related location information.
- **Files:**
  - `app/(tabs)/map.tsx`
  - `components/MapComponent.tsx`
  - `components/MapComponent.web.tsx`

### Feature: Disease activity map analytics
- **What it does:** map heat indicators and trend overlays from diagnosis reports store.
- **Files:**
  - `components/DiseaseMapComponent.tsx`
  - `components/DiseaseMapComponent.web.tsx`
  - `data/diseaseHeatmap.ts`
  - `app/(tabs)/map.tsx`

### Feature: Crop diagnosis capture (camera/gallery)
- **What it does:** capture/upload images, call diagnosis API, render best-confidence result, display XAI overlay (highlighted evidence) + explanation text + confidence interpretation.
- **File:** `app/diagnosis.tsx`
- **Dependencies:** disease API (`/diagnose`) and local dataset (`data/diseaseHeatmap.ts`)

### Feature: Weekly reports export (client-side PDF)
- **What it does:** builds a formatted report from local analytics data and exports/shares as PDF.
- **File:** `app/reports.tsx`
- **Dependency:** `data/diseaseHeatmap.ts`

## 2.4 Chat and voice features

### Feature: AI chat screen
- **What it does:** message thread, language-aware prompting metadata, typing indicators, error handling and retry behavior.
- **Files:**
  - `app/(tabs)/chat.tsx`
  - `components/TypingIndicator.tsx`
  - `utils/chatbotApi.ts`

### Feature: Voice recording/transcription overlay
- **What it does:** microphone capture, upload for transcription, transcript injection into chat input flow.
- **File:** `components/VoiceOverlay.tsx`
- **Dependency:** chatbot API (`/voice/transcribe`)

## 2.5 Additional app features

### Feature: Calculator screen (in-app)
- **What it does:** local nutrient and irrigation calculations by crop, stage, and area.
- **File:** `app/calculator.tsx`

### Feature: Journal screen (in-app local flow)
- **What it does:** local intervention logging and basic weather alert simulation UI.
- **File:** `app/journal.tsx`

### Feature: Community gallery screen (in-app local flow)
- **What it does:** region/crop filtering over local mock posts and outbreak-style post cards.
- **File:** `app/gallery.tsx`

### Feature: Account screen
- **What it does:** account info and management options UI shell.
- **File:** `app/account.tsx`

### Feature: Settings screen
- **What it does:** grouped settings UI shell (language/appearance/security/etc).
- **File:** `app/settings.tsx`

### Feature: FAQ/help screen
- **What it does:** expandable Q&A interface.
- **File:** `app/faq.tsx`

## 2.6 Shared frontend infrastructure features

### Feature: Auth context/session manager
- **Files:** `hooks/useAuth.tsx`, `utils/storage.ts`
- **Behavior:** login/logout/session persistence and restoration.

### Feature: Language context
- **File:** `hooks/useAppLanguage.tsx`
- **Behavior:** global EN/FR/AR toggling with persistence (`wafra_app_language`), RTL support state; consumed by Home, Chat, Settings, FAQ, Account, Diagnosis, and tab labels.

### Feature: API client with token refresh
- **File:** `data/sources/axiosInstance.ts`
- **Behavior:** token injection, 401 interception, refresh attempts.

### Feature: Chatbot endpoint discovery/fallback
- **File:** `utils/chatbotApi.ts`
- **Behavior:** health probing and host fallback for local/LAN/dev.

### Feature: Hyper-local risk (production-oriented)
- **Files:** `chatbot/main.py`, `app/(tabs)/home.tsx`
- **Behavior:** GPS → `/weather` (OpenWeather fetch + 1h cache) → `/risk` (rule table + 48h forecast intelligence) → dashboard risk card; optional `/alerts` for human messages.

### Feature: Disease report store and analytics
- **File:** `data/diseaseHeatmap.ts`
- **Behavior:** in-memory report storage, subscriptions, filters, cluster/trend analysis.

---

## 3) Django Backend Features (`backend/`)

Core files:
- `backend/core/settings.py`
- `backend/core/urls.py`
- `backend/manage.py`

## 3.1 Platform and cross-cutting backend features

### Feature: API documentation surfaces
- **Endpoints:** `/swagger/`, `/redoc/`, `/swagger.json`
- **File:** `backend/core/urls.py`

### Feature: JWT + OAuth2 auth configuration
- **What it does:** supports JWT auth flow with refresh and optional oauth-backed auth class support.
- **File:** `backend/core/settings.py`

### Feature: Media serving in debug mode
- **What it does:** serves uploaded media while developing.
- **File:** `backend/core/urls.py`

## 3.2 Auth app features (`backend/Auth/`)

### Entities
- `User`
- `PasswordResetToken`
- `EmailVerificationCode`

### Endpoints and capabilities
- `POST /auth/register/` - account creation (email/phone path)
- `POST /auth/login/` - login and JWT issuance
- `POST /auth/logout/` - refresh token blacklist/logout
- `POST /auth/token/refresh/` - token refresh
- `GET /auth/profile/` - profile fetch
- `PATCH /auth/profile/` - profile update
- `DELETE /auth/profile/` - account deletion
- `POST /auth/profile/change-password/` - password change
- `POST /auth/forgot-password/` - password reset request email
- `POST /auth/reset-password/` - password reset token redemption
- `POST /auth/google/` - Google OAuth login bridge
- `POST /auth/verify-email/` - verify email with code
- `POST /auth/resend-verification/` - resend verification code

### Files
- `backend/Auth/models.py`
- `backend/Auth/views.py`
- `backend/Auth/urls.py`
- `backend/Auth/permissions.py`

## 3.3 Locator app features (`backend/locator/`)

### Entity
- `AidCenter`

### Endpoints and capabilities
- `GET /locator/nearest/` - nearest aid centers by geospatial distance
- `GET /locator/all/` - active centers list/filter
- `POST /locator/create/` - create aid center (authenticated farmer)
- `GET /locator/<pk>/` - center detail
- `PATCH /locator/<pk>/manage/` - owner-managed update
- `DELETE /locator/<pk>/manage/` - owner-managed soft delete/deactivate

### Files
- `backend/locator/models.py`
- `backend/locator/views.py`
- `backend/locator/urls.py`

## 3.4 Journal app features (`backend/journal/`)

### Entities
- `FieldLog`
- `WeatherAlert`

### Endpoints and capabilities
- `GET /journal/logs/` - list field logs (filterable)
- `POST /journal/logs/` - create field log and optionally generate weather alert
- `GET /journal/logs/<pk>/` - log detail
- `PATCH /journal/logs/<pk>/` - update log
- `DELETE /journal/logs/<pk>/` - delete log
- `GET /journal/alerts/` - alerts inbox
- `PATCH /journal/alerts/<pk>/read/` - mark alert read

### Integrations
- IP geolocation API
- Open-Meteo weather API
- Groq LLM for generated agronomic alert wording

### Files
- `backend/journal/models.py`
- `backend/journal/views.py`
- `backend/journal/utils.py`
- `backend/journal/urls.py`

## 3.5 Gallery app features (`backend/gallery/`)

### Entities
- `Post`
- `PostImage`
- `Comment`

### Endpoints and capabilities
- `GET /api/gallery/` - feed listing/filtering
- `POST /api/gallery/create/` - create post with multi-image upload
- `GET /api/gallery/<uuid>/` - post detail + comments
- `PATCH /api/gallery/<uuid>/update/` - author post update
- `DELETE /api/gallery/<uuid>/delete/` - author delete with image file cleanup
- `POST /api/gallery/<uuid>/comments/` - create comment
- `DELETE /api/gallery/<uuid>/comments/<comment_uuid>/delete/` - author comment delete

### Files
- `backend/gallery/models.py`
- `backend/gallery/views.py`
- `backend/gallery/urls.py`

## 3.6 Reports app features (`backend/reports/`)

### Entity
- `WeeklyReport`

### Endpoints and capabilities
- `POST /api/reports/generate/` - aggregate diagnosis data, generate report, output PDF/HTML
- `GET /api/reports/` - list generated reports
- `GET /api/reports/preview/` - preview current period summary

### Integrations
- Groq for recommendation text generation
- WeasyPrint for PDF rendering fallback strategy

### Files
- `backend/reports/models.py`
- `backend/reports/views.py`
- `backend/reports/utils.py`
- `backend/reports/urls.py`

## 3.7 Calculator app features (`backend/calculator/`)

### Endpoint and capability
- `/api/calculator/` returns calculator service status payload.

### Files
- `backend/calculator/views.py`
- `backend/calculator/urls.py`
- `backend/calculator/models.py` (scaffold)
- `backend/calculator/tests.py` (scaffold)

## 3.8 Scaffolded backend modules (feature placeholders)

- `backend/chatbot/` (scaffold app in Django backend; no active route surface)
- `backend/diagnosis/` (scaffold; expected by reports integration but currently thin)
- `backend/crops/` (scaffold)

---

## 4) Chatbot Service Features (`chatbot/`)

Core file: `chatbot/main.py`

## 4.1 API features
- `POST /chat`
- `POST /voice/transcribe`
- `POST /voice/speak`
- `GET /weather` (OpenWeather fetch + cache)
- `POST /risk` (rule-based risk engine + 48h forecast check)
- `POST /alerts` (risk → human alert messages)
- `GET /health`
- `GET /`

## 4.2 Conversational intelligence features

### Feature: Multilingual message handling
- Detects and routes user language signals for EN/FR/AR/Darija interactions.

### Feature: Dialect-constrained response generation
- Enforces Algerian Darija style constraints and post-generation cleanup rules.

### Feature: Voice mode answer shaping
- Produces shorter speech-friendly answers when voice mode is enabled.

### Feature: Grounding-aware disease advice fallback
- For low-confidence/low-grounding disease intents, triggers clarification prompts.

## 4.3 Voice AI features

### Feature: STT pipeline
- Groq Whisper transcription with Algerian agriculture-focused prompt tuning.

### Feature: TTS pipeline
- Model and voice selection by language mode.

## 4.4 Retrieval and knowledge features

### Feature: Hybrid RAG retrieval
- BM25 sparse retrieval over KB + optional dense retrieval path (sentence-transformers + FAISS).
- File: `chatbot/rag_engine.py`

### Feature: KB context injection
- Retrieved documents injected into chat system context for grounded responses.

### Feature: KB and index assets
- `chatbot/kb.json`
- `chatbot/kb.index` (when dense enabled)
- `chatbot/eval_set.json`
- `chatbot/build_kb_index.py` (builds FAISS index when dense retrieval enabled)

## 4.5 Chatbot web fallback feature
- Standalone browser interface with chat + voice controls.
- File: `chatbot/static/index.html`

## 4.6 Chatbot support scripts and dev tools
- `chatbot/build_kb_index.py` - index bootstrap/check utility.
- `chatbot/patch_prompts.py` - prompt patch utility.
- `chatbot/fix_syntax.py` - syntax fix helper.
- `chatbot/test.py`, `chatbot/test_darija.py` - manual test scripts.

---

## 5) Disease Service Features (`disease/`)

Core file: `disease/main.py`

## 5.1 API features
- `POST /diagnose`
- `GET /crops`
- `GET /health`
- `GET /`

## 5.2 Vision inference features

### Feature: Image validation and safety guards
- Validates image type and max upload size.

### Feature: Preprocessing and stabilization
- Auto-contrast normalization and test-time augmentation views.

### Feature: Crop auto-detection
- CLIP-based zero-shot crop candidate detection and routing confidence.

### Feature: Disease classification
- ViT model inference over class set with confidence calibration.

### Feature: Crop-aware inference routing
- Crop-restricted diagnosis for high-confidence crop detection.
- Supported-candidate fallback route.
- Full-class fallback when crop signal is uncertain.

### Feature: Ranked diagnostic output
- Returns top prediction plus ranked alternatives and uncertainty metadata.

## 5.3 Metadata and advisory features
- Severity tagging and explanatory advisory text.
- Processing latency reporting.

## 5.5 Explainable AI (XAI) overlay (hackathon path)
- **What it does:** generates a lightweight evidence overlay (HSV/RGB heuristics) and returns an explanation template + confidence level.
- **Backend files:** `disease/main.py` (adds `explanation`, `heatmap_url`, `confidence_level`; saves overlays under `disease/static/generated/`)
- **Frontend files:** `app/diagnosis.tsx` (renders original + overlay + explanation; includes Show/Hide overlay toggle and uncertainty warning)

## 5.4 Disease web fallback feature
- Browser-based uploader with diagnostic output panels.
- File: `disease/static/index.html`

---

## 6) Offline Subsystem Features (`offline/`)

## 6.1 Offline backend API features

### Endpoints
- `GET /api/v1/offline/crops/`
- `GET /api/v1/offline/crops/{slug}/`
- `GET /api/v1/offline/diseases/`
- `GET /api/v1/offline/diseases/{slug}/`
- `GET /api/v1/offline/sync/?since=...`

### Entities
- `CropFactSheet`
- `Disease`

### Files
- `offline/backend/offline_content/models.py`
- `offline/backend/offline_content/views.py`
- `offline/backend/offline_content/serializers.py`
- `offline/backend/offline_content/urls.py`
- `offline/config/urls.py`

## 6.2 Offline frontend features

### Feature: Local SQLite content cache
- Schema and storage for crops/diseases and sync metadata.
- Files:
  - `offline/frontend/src/core/database/schema.ts`
  - `offline/frontend/src/core/database/database.ts`

### Feature: Incremental synchronization
- Pulls remote deltas by `since` timestamp and upserts local records.
- Files:
  - `offline/frontend/src/features/offline_content/data/datasources/OfflineRemoteDataSource.ts`
  - `offline/frontend/src/features/offline_content/data/datasources/OfflineLocalDataSource.ts`
  - `offline/frontend/src/features/offline_content/data/repositories/OfflineContentRepositoryImpl.ts`

### Feature: Offline state and connectivity awareness
- Tracks online/offline/syncing state and auto-syncs on reconnect.
- Files:
  - `offline/frontend/src/features/offline_content/presentation/store/offlineStore.ts`
  - `offline/frontend/src/features/offline_content/presentation/hooks/useNetworkStatus.ts`
  - `offline/frontend/src/features/offline_content/presentation/hooks/useOfflineSync.ts`

### Feature: Offline UI components
- Banner, badge, and bootstrap components for app-level integration.
- Files:
  - `offline/frontend/src/features/offline_content/presentation/components/OfflineBanner.tsx`
  - `offline/frontend/src/features/offline_content/presentation/components/OfflineBadge.tsx`
  - `offline/frontend/src/features/offline_content/presentation/components/OfflineBootstrap.tsx`

### Feature: Offline crop/disease screens
- Searchable crop and disease lists + detail screens with bilingual content.
- Files:
  - `offline/frontend/src/features/offline_content/presentation/screens/CropsListScreen.tsx`
  - `offline/frontend/src/features/offline_content/presentation/screens/CropDetailScreen.tsx`
  - `offline/frontend/src/features/offline_content/presentation/screens/DiseasesListScreen.tsx`
  - `offline/frontend/src/features/offline_content/presentation/screens/DiseaseDetailScreen.tsx`

## 6.3 Offline support features
- Content seeding command:
  - `offline/backend/offline_content/management/commands/seed_offline_content.py`
- Offline API tests:
  - `offline/backend/offline_content/tests/test_endpoints.py`
  - `offline/backend/offline_content/tests/test_api.py`
- Offline module docs:
  - `offline/README.md`

---

## 7) Standalone and Data Features

## 7.1 Standalone web calculator (`calc/`)

### Features
- Crop/stage dependent nutrient and water requirement calculations.
- Dynamic stage dropdown by crop.
- Animated result cards and validation states.

### Files
- `calc/index.html`
- `calc/style.css`
- `calc/script.js`

## 7.2 Fact sheets data system (`fact_sheets/`)

### Features
- Structured multilingual crop agronomy content:
  - planting windows,
  - water needs,
  - disease references,
  - yields,
  - metadata/sources.

### File
- `fact_sheets/data/crops.json`

---

## 8) Operational and Dev Workflow Features

### Feature: One-command FastAPI launcher
- Kills conflicting processes on `8000` and `9000`, starts disease + chatbot services.
- File: `start_green.ps1`
- **Note:** injects `GROQ_API_KEY` and `OPENWEATHER_API_KEY` into chatbot process from `chatbot/.env.local` when present.

### Feature: Python virtualenv bootstrap
- Creates and installs service environments for chatbot and disease modules.
- File: `setup_venvs.ps1`

### Feature: Environment template
- Documents expected env vars for frontend integration.
- File: `.env.example`

---

## 9) Integration Dependency Catalog

## 9.1 External service dependencies
- Groq API (chat completion, STT, TTS, report/journal AI text generation).
- Google OAuth user info API.
- Weather/geolocation providers (Open-Meteo for basic temperature display + OpenWeather forecast for backend `/weather` risk engine).
- Optional PDF renderer stack (WeasyPrint path in backend reports).

## 9.2 Cross-service integration paths
- Frontend chat + voice -> chatbot service endpoints.
- Frontend diagnosis -> disease service endpoint.
- Frontend Home risk card -> chatbot service endpoints (`/weather` -> `/risk`) using device GPS.
- Frontend auth/business APIs -> Django endpoints.
- Reports/journal backends consume weather and AI dependencies.
- Offline frontend syncs against offline backend `/api/v1/offline/sync/`.

---

## 9.3 AI robustness and safety behaviors (implemented)

This project intentionally adds **robustness layers** around AI outputs to reduce hallucination, improve dialect correctness, and degrade gracefully under uncertainty.

### Chatbot robustness (LLM + RAG)
- **Grounding-first answers**: retrieved KB context is injected into the system prompt before calling Groq, with explicit rules: **no hallucination** and **ask when unsure**.
  - **Files**: `chatbot/main.py`, `chatbot/rag_engine.py`, `chatbot/kb.json`
- **Hybrid retrieval for noisy Darija inputs**: BM25 keyword retrieval is always available; optional dense retrieval (SentenceTransformers + FAISS) improves multilingual matching.
  - **Files**: `chatbot/rag_engine.py`, `chatbot/build_kb_index.py`
- **Darija/Arabizi query normalization**: common Darija tokens are mapped to canonical agronomy terms before retrieval to improve recall.
  - **File**: `chatbot/rag_engine.py` (`DARJA_MAP`)
- **Uncertainty behavior**: when disease intent is present but symptoms are incomplete and the reply is not sufficiently grounded, the system falls back to **1–2 clarifying questions** instead of guessing.
  - **File**: `chatbot/main.py` (`should_force_clarification`, `is_grounded`, `clarification_fallback`)
- **Dialect drift guards**: forbidden non-Algerian terms are detected and corrected (post-processing patch) to prevent Moroccan/Egyptian drift.
  - **File**: `chatbot/main.py` (`has_wrong_dialect`, `patch_wrong_dialect`)
- **Output sanitation**: unexpected script noise is removed from replies to avoid random characters appearing in responses.
  - **File**: `chatbot/main.py` (`sanitize_reply_for_language`)

### Disease diagnosis robustness (Vision + UX)
- **Stabilized inference**: test-time augmentation (TTA), auto-contrast, and crop-aware routing improve stability on real field photos.
  - **File**: `disease/main.py` (`_build_views`, `_auto_contrast`, crop auto-detection + routing)
- **Confidence interpretation layer**: raw confidence is mapped to `high` / `medium` / `uncertain`, and the UI warns the user when uncertain.
  - **Backend**: `disease/main.py` (`_confidence_level`)
  - **Frontend**: `app/diagnosis.tsx` (uncertainty warning)
- **Explainability overlay**: lightweight XAI overlay highlights suspected lesion/discoloration regions and provides an explanation string so the user sees “why”.
  - **Backend**: `disease/main.py` (`_generate_lightweight_heatmap`, `explanation`, `heatmap_url`)
  - **Frontend**: `app/diagnosis.tsx` (overlay + Show/Hide toggle)

---

## 10) Feature Status Notes (important)

These are implemented artifacts in code and should be tracked during stabilization:

- Some frontend screens are local/mock-first and not fully wired to corresponding Django endpoints yet (`gallery`, `journal`, `calculator`, parts of `reports`).
- Auth client route prefix may require alignment with backend mounted auth base path.
- Some backend modules are scaffold placeholders (`backend/chatbot`, `backend/diagnosis`, `backend/crops`).
- Reports app references diagnosis model paths that should be validated against current diagnosis app implementation.

---

## 11) Recommended Next Docs for Absolute Completeness

If you want documentation that is contract-grade and audit-ready, generate these next:
- `API_ENDPOINT_REFERENCE.md` (method/path/request/response/auth/errors for every endpoint).
- `FEATURE_STATUS_MATRIX.md` (implemented vs partial vs mock vs scaffold).
- `ENVIRONMENT_VARIABLE_REFERENCE.md` (all env vars by service, defaults, required/optional).
- `TEST_COVERAGE_BY_FEATURE.md` (feature -> test files -> known gaps).

