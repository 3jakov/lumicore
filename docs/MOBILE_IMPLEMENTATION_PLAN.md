# Mobile Implementation Plan — LUMICO React Native App
**Version:** 1.0
**Date:** 2026-05-06
**Status:** Active — Phase 2
**Owner:** Claude Code (apps/mobile) + shared API (apps/api)

---

## Overview

Field workers (Paigaldus group) need a native mobile app for:
1. **Timer** — start/pause/stop without opening a browser
2. **Camera** — photo capture with GPS directly to S3 (no gallery save)
3. **Projects + Tasks** — quick lookup of what to work on
4. **My Timesheet** — own hours for the current month
5. **Push Notifications** — APNs/FCM for timer reminders (8:00 / 18:00)

The backend is identical to the web app — same NestJS API, same endpoints, same `shared-types`. No parallel backend.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo SDK 55 + Expo Router | Managed workflow, OTA updates, file-based routing |
| RN version | 0.76.7 (bundled with Expo 55) | Latest stable with Expo 55 |
| Styling | NativeWind v4 (Tailwind) | Same class names as web, design token reuse |
| Navigation | Stack (no tabs) | Worker-first: home = hub, drill down per task |
| Auth tokens | `expo-secure-store` | iOS Keychain / Android Keystore, not AsyncStorage |
| Server state | TanStack React Query v5 | Same library as web, same patterns |
| Global state | Zustand | Auth store only |
| API client | `src/lib/api-client.ts` | Thin fetch wrapper with `setTokenProvider()` injection |
| WebSocket | `socket.io-client` (M5) | Same as web, auth via `auth: { token }` handshake |
| Camera | `expo-camera` (M2) | Expo-managed, no native code |
| Location | `expo-location` (M2) | GPS for photo metadata |
| Push | `expo-notifications` (M5) | APNs + FCM via Expo push service |

---

## Monorepo Integration

```
apps/mobile/
├── app/                  # Expo Router file-based routes
│   ├── _layout.tsx       # Root: QueryClient + SafeArea + AuthGate
│   ├── (auth)/           # Login screen (no header)
│   └── (app)/            # Authenticated screens (Stack)
│       ├── index.tsx     # Home hub — tile grid + FABs
│       ├── timer.tsx     # Timer screen (M1)
│       ├── camera.tsx    # Camera capture (M2)
│       ├── projects.tsx  # Projects list (M3)
│       ├── tasks.tsx     # Tasks list (M3)
│       ├── photos.tsx    # My photos (M3)
│       ├── documents.tsx # Documents (M3)
│       └── team.tsx      # Team overview (M4+)
├── src/
│   ├── lib/
│   │   └── api-client.ts   # fetch wrapper; post(path, { body }) syntax
│   ├── store/
│   │   └── auth.store.ts   # Zustand: hydrate / login / logout
│   ├── hooks/              # React Query hooks per domain
│   ├── components/         # Reusable components per domain
│   └── theme/
│       └── colors.ts       # JS constants matching Tailwind config
├── tailwind.config.js      # Dark theme tokens (surface-0/1/2, accent, timer-*)
├── metro.config.js         # watchFolders for @lumicore/shared-types
└── tsconfig.json           # "types": ["nativewind/types"]
```

**Shared types:** `@lumicore/shared-types` resolves directly to source (`../../packages/shared-types/src/index.ts`) via tsconfig paths — no build step needed.

---

## Milestones

### ✅ M0 — Foundation (done: `92cde76`)

**Goal:** App launches, authenticates, navigates to home hub.

- Expo 55 project in monorepo with Metro watchFolders
- NativeWind v4 + dark design tokens
- Auth store (Zustand + SecureStore) with token hydration on startup
- Expo Router: `(auth)/login` → `(app)/index` redirect gate
- Home screen: 2×3 tile grid + camera FAB + timer FAB
- All stub screens (M1–M6 placeholders)

---

### ✅ M1 — Timer MVP (done: `b6edf6c`)

**Goal:** Worker can start, pause, resume, stop timer from the phone.

**New backend endpoint:**
- `GET /api/v1/time-entries/active` → `TimeEntryDetail | null` (own running timer)

**Mobile screens/components:**
- `ElapsedClock` — live counter (freezes on pause, handles H:MM:SS / MM:SS)
- `ActiveTimerCard` — project/reason label + clock + pause⇄resume + stop
- `StartTimerSheet` — project picker → cascading task picker → no-project toggle + reason (≥10 chars)
- `timer.tsx` — composes all states: loading / error / active / idle

**Hooks:** `useActiveTimer`, `useStartTimer`, `usePauseTimer`, `useResumeTimer`, `useStopTimer`, `useProjects`, `useTasks`

**Known gap (M3 polish):** `ActiveTimerCard` shows `#project_id` instead of project name — `TimeEntryDetail` doesn't carry `project_name`. Fix: extend shared-types or add a project lookup.

---

### 🔜 M2 — Camera MVP

**Goal:** Worker opens camera, takes photo, it lands in S3 with GPS — same as PWA but native.

**Permissions needed:**
- `expo-camera` — `useCameraPermissions()`
- `expo-location` — `requestForegroundPermissionsAsync()`
- Add to `app.json` plugins: `expo-location`

**Flow:**
1. Camera screen opens full-screen viewfinder (`expo-camera` CameraView)
2. Worker optionally selects project/task (bottom sheet, same components as M1)
3. Capture → get GPS concurrently via `expo-location`
4. `POST /api/v1/photos/upload-url` → presigned S3 PUT URL
5. PUT image blob directly to S3
6. `POST /api/v1/photos` with `{ s3_key, project_id, task_id, gps_lat, gps_lng, taken_at }`
7. Success toast → camera ready for next shot

**No gallery save** — same principle as PWA `getUserMedia`. The image never lands in the photo roll.

**New hook:** `useUploadPhoto` — orchestrates the two-step S3 upload + metadata POST.

---

### 🔜 M3 — Projects + Tasks

**Goal:** Worker can see their active projects and tasks without the full web app.

**Screens:**
- `projects.tsx` — scrollable list, search, status badge
- `tasks.tsx` — list filtered by project (drill-down from projects screen)
- `photos.tsx` — my photos gallery (thumbnails, tap to expand)
- `documents.tsx` — project documents list (tap to open in browser)

**Note:** Read-only in M3. Create/edit stays in web admin.

---

### 🔜 M4 — My Timesheet

**Goal:** Worker can see own hours for current month.

**Screen:** `timesheet.tsx` — calendar grid (Mon–Sun rows), color-coded cells, total vs norm. Uses `GET /time-entries/timesheet?date_from=...&date_to=...`.

---

### 🔜 M5 — Push Notifications

**Goal:** Timer reminder pushes (8:00 / 18:00) delivered to phone, not just in-app bell.

**Backend changes:**
- `POST /api/v1/notifications/device-token` — register Expo push token for employee
- `Notification` cron: also call Expo Push API when sending notification
- `DeviceToken` model in Prisma: `employee_id`, `token`, `platform` (ios/android), `created_at`

**Mobile:**
- Register on app launch with `expo-notifications`
- `useRegisterPushToken` hook — calls backend on startup
- Local notification permission request on first launch

**Note:** Uses Expo Push Service (proxies APNs + FCM) — no direct APNs/FCM credentials needed in Phase 2. Can migrate to direct APNs/FCM later.

---

## Design Tokens (tailwind.config.js)

```
surface-0   #111827   Background
surface-1   #1F2937   Cards
surface-2   #374151   Inputs, secondary buttons
text-primary #F9FAFB
text-muted   #9CA3AF
border       #374151
accent-500   #F59E0B   Amber — links, active states, pause button
timer-active #16A34A   Green — start button, running indicator
timer-stop   #DC2626   Red — stop button, errors
```

---

## API Client Usage

```typescript
// Correct
apiClient.post('/time-entries', { body: dto })
apiClient.post('/time-entries/:id/pause')       // no body
apiClient.get('/time-entries/active')
apiClient.patch('/employees/me', { body: { language: 'et' } })
```

Key: `post/patch` accept `options?: { body?: unknown; headers?: Record<string, string> }`.
Pass the DTO inside `{ body: dto }`, not as the second argument directly.

---

## Testing Strategy

- **M1–M4:** Manual test on device/simulator via `expo start`
- **No unit tests in mobile** (Expo managed workflow, UI-heavy — integration tests not worth the overhead at this scale)
- **API contracts:** Covered by backend unit tests + typecheck
- **Typecheck:** `pnpm --filter @lumicore/mobile typecheck` must pass before every commit

---

## Commit Scope

Use scope `mobile` for `apps/mobile` changes:
```
feat(mobile): add camera capture with GPS upload
feat(time-tracking): extend GET /active to include project_name
```

Use `time-tracking` / `employees` etc. for backend changes that enable mobile features.

---

*Maintained alongside `docs/IMPLEMENTATION_PLAN.md` (Phase 1).*
*Read alongside: `CLAUDE.md` (mobile section), `docs/MOBILE_READINESS.md`.*
