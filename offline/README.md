# wafra_offline  Partial Offline Module

Caches crop fact sheets and the 10 most common diseases on-device so farmers with no signal can still browse advice. Shows a clear offline banner and badge whenever the app is running from cached data.

---

## How it works

On first launch (online) the app calls `/api/v1/offline/sync/` and stores everything in a local SQLite database. Every record carries an `updated_at` timestamp — subsequent syncs use `?since=<ISO>` so only changes are fetched. When the device goes offline, screens read from SQLite and the UI switches to offline mode automatically. A silent re-sync fires when connectivity returns.

---

## Structure

```
wafra_offline/
├── backend/
│   └── offline_content/
│       ├── models.py             CropFactSheet, Disease
│       ├── serializers.py
│       ├── views.py              List, detail, and sync endpoints
│       ├── urls.py
│       ├── admin.py
│       └── management/commands/seed_offline_content.py
├── config/                       Django settings, urls, wsgi, asgi
├── frontend/src/
│   ├── core/
│   │   ├── database/             SQLite init + schema
│   │   └── network/              NetInfo wrapper
│   └── features/offline_content/
│       ├── data/                 DTOs, local/remote data sources, repository
│       ├── domain/               Entities, repository interface, use cases
│       └── presentation/         Screens, hooks, components, Zustand store
├── manage.py
└── pytest.ini
```

---

## Backend

```bash
python -m venv venv && source venv/bin/activate
pip install django djangorestframework django-cors-headers
python manage.py migrate
python manage.py seed_offline_content
python manage.py runserver
```

**API endpoints**

| URL | Description |
|-----|-------------|
| `GET /api/v1/offline/crops/` | All active crops |
| `GET /api/v1/offline/crops/<slug>/` | Single crop |
| `GET /api/v1/offline/diseases/` | All active diseases |
| `GET /api/v1/offline/diseases/<slug>/` | Single disease |
| `GET /api/v1/offline/sync/` | Full bundle |
| `GET /api/v1/offline/sync/?since=<ISO>` | Incremental sync |

Sync response shape (stable contract):

```json
{
  "server_time": "2026-04-28T10:00:00Z",
  "crops": [...],
  "diseases": [...],
  "deleted_crop_slugs": [],
  "deleted_disease_slugs": []
}
```

Run tests:

```bash
pytest
```

---

## Frontend integration

**Dependencies**

```bash
npx expo install expo-sqlite @react-native-community/netinfo
npm install zustand
```

**Startup wiring** (App.tsx or \_layout.tsx):

```tsx
await initDatabase();
initOfflineContentDi();
```

**Root layout** (mount once):

```tsx
<OfflineBanner />
<OfflineBootstrap />
```

**The one line to update:** `OfflineRemoteDataSource.ts` imports `apiClient` from `@/core/api/apiClient`. Change that path to match your project's HTTP client.

**Screens**

| Screen | Props |
|--------|-------|
| `CropsListScreen` | `onSelectCrop?: (slug) => void` |
| `CropDetailScreen` | `slug: string` |
| `DiseasesListScreen` | `onSelectDisease?: (slug) => void` |
| `DiseaseDetailScreen` | `slug: string` |

Integrate them into your existing navigator (React Navigation, Expo Router, etc.) — there is no router dependency inside this module.
