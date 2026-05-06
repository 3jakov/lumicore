# Mobile Readiness — LUMICO Phase 1
**Version:** 1.1
**Date:** 2026-05-06
**Status:** Reference — native app (Phase 2) is now in development

> **Scope of this document:** This document defined what Phase 1 must preserve for a future native app. The native app (Expo SDK 55, `apps/mobile/`) is now being built in Phase 2. Use `docs/MOBILE_IMPLEMENTATION_PLAN.md` for the active Phase 2 plan. This document remains useful as a backend API contract checklist.

---

## Table of Contents

1. [Objective](#1-objective)
2. [Current Decisions That Already Help Future Native Apps](#2-current-decisions-that-already-help-future-native-apps)
3. [Risks to Avoid During Phase 1](#3-risks-to-avoid-during-phase-1)
4. [Required Engineering Rules](#4-required-engineering-rules)
5. [Recommended Additions to Current Docs](#5-recommended-additions-to-current-docs)
6. [Mobile Readiness Checklist](#6-mobile-readiness-checklist)
7. [Final Recommendation](#7-final-recommendation)

---

## 1. Objective

LUMICO's field workers (Paigaldusspetsialist group) are the heaviest mobile users. A native iOS/Android app would give them faster camera access, reliable background GPS, better push notifications, and offline support that goes beyond what a PWA can guarantee on iOS Safari.

The goal is to ensure the Phase 1 NestJS backend is the **only backend** that a future native app needs — no parallel API, no rewrites, no data model changes. The PWA and the future native app should be interchangeable clients consuming identical API endpoints.

**This means:** every architectural decision in Phase 1 must be evaluated not just for "does it work in a browser?" but also for "will it block a React Native or Swift/Kotlin client in Phase 2?"

---

## 2. Current Decisions That Already Help Future Native Apps

The following Phase 1 choices are already correct from a mobile readiness perspective. They must not be undone.

### 2.1 REST API with explicit versioning
`/api/v1/` prefix on all endpoints. A native app consumes the exact same base URL. Version prefix means breaking changes can go to `/api/v2/` while the app in the field keeps working on v1.

### 2.2 JWT access token via Authorization header
Access token sent as `Authorization: Bearer <token>` — not embedded in cookies. Native apps cannot use `httpOnly` browser cookies, but they can store a token in iOS Keychain or Android Keystore and attach it to every request. The access token side is already correct.

### 2.3 Phone OTP login as primary auth
`POST /api/v1/auth/otp/request` + `POST /api/v1/auth/otp/verify` is the most natural login flow on mobile. No username/password to type on a touchscreen. This flow works identically in React Native, Swift, or Kotlin — it is purely HTTP.

### 2.4 Presigned S3 upload for photos and documents
The two-step upload flow (get presigned URL → PUT directly to S3 → POST metadata) works identically for any HTTP client. React Native, Swift URLSession, Kotlin OkHttp — all can execute this flow without any backend changes. The backend never receives binary data, which also means no request size limit issues.

### 2.5 GPS and photo metadata as API fields
GPS coordinates are stored as `gps_lat` / `gps_lng` fields in the `Photo` model — not embedded in EXIF or tied to the browser geolocation API. A native app uses `CLLocationManager` (iOS) or `FusedLocationProviderClient` (Android) and passes the same fields. No API change needed.

### 2.6 Strongly typed shared-types package
`packages/shared-types` contains pure TypeScript interfaces with no React or Next.js imports. These types can be consumed by a React Native codebase directly, or used as a reference contract for Swift/Kotlin model generation. The separation is already correct.

### 2.7 Standardized error response format
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Timer requires project or reason (min 10 chars).",
  "field": "project_id"
}
```
The `field` property enables native apps to highlight the exact form field that failed — the same UX as the web app. No error format changes needed.

### 2.8 Socket.io with JWT handshake auth
WebSocket authentication uses `auth: { token }` in the handshake, not cookies. This works in `socket.io-client` for React Native. The reconnection strategy (exponential backoff, 1s→30s) is also appropriate for mobile networks.

### 2.9 Pagination envelope
`{ data: [], meta: { total, page, limit } }` is a standard REST envelope that any native HTTP client can parse without special handling.

### 2.10 Swagger / OpenAPI at `/api/docs`
Auto-generated from NestJS decorators. In Phase 2, this OpenAPI spec can be used to auto-generate a typed Swift or Kotlin API client (via `openapi-generator`) with zero manual work.

---

## 3. Risks to Avoid During Phase 1

These are concrete patterns that, if implemented now, would require backend rework before a native app can use the API.

### 🔴 Risk 1 — Refresh token only accessible via httpOnly cookie

**Current state:** Refresh token is stored as an `httpOnly, Secure, SameSite=Strict` cookie.

**Why this is a problem for native apps:** Native apps do not have a browser cookie jar. An `httpOnly` cookie cannot be read or sent by `URLSession`, `OkHttp`, or `axios` in React Native when running outside of a `WebView`. A native app that calls `POST /auth/refresh` will never have the cookie automatically attached.

**Required fix (Phase 1):** The `POST /auth/refresh` endpoint must **also** accept the refresh token as a request body field (`{ refresh_token: "..." }`) in addition to the cookie. Web clients continue using the cookie. Native clients (Phase 2) will send the token from secure storage in the request body.

```typescript
// auth.controller.ts — dual-mode refresh
async refresh(
  @Req() req: Request,
  @Body() body: RefreshTokenDto,  // { refresh_token?: string }
) {
  // Cookie takes priority (web); fall back to body field (native)
  const token = req.cookies?.refresh_token ?? body.refresh_token;
  if (!token) throw new UnauthorizedException('No refresh token provided');
  return this.authService.refreshTokens(token);
}
```

**This does not weaken security** — the token is hashed in the DB and rotated on use regardless of transport. The body field is protected by HTTPS.

### 🔴 Risk 2 — Business logic in Next.js Server Components or Server Actions

**Why this is a problem:** If any data mutation or business logic is implemented as a Next.js Server Action (e.g., `'use server'`) or Next.js API route rather than a NestJS endpoint, a native app has no way to call it. It is effectively web-only logic.

**Rule:** Every mutation — creating a time entry, uploading a photo, acknowledging a document — must go through `POST/PATCH/DELETE /api/v1/...` on the NestJS backend. Next.js API routes (`app/api/`) must only be thin proxies if needed for SSR, never the source of truth.

### 🟡 Risk 3 — Push notifications tied only to Web Push VAPID

**Current state:** Push notifications use Web Push (VAPID keys). This works in Android Chrome and iOS Safari 16.4+.

**Why this matters:** Native apps use APNs (Apple Push Notification service) for iOS and FCM (Firebase Cloud Messaging) for Android. These are completely different protocols from Web Push.

**Required rule:** The `NotificationService` backend must be abstracted from the transport layer. The service receives `(employeeId, notificationType, payload)` and decides how to deliver it based on the employee's registered device tokens, not hard-coded to Web Push.

```typescript
// What to implement in Phase 1:
interface NotificationService {
  // Stores device push token with type
  registerDevice(employeeId: number, token: string, type: 'web-push' | 'apns' | 'fcm'): Promise<void>;

  // Sends notification without caring about transport
  send(employeeId: number, notification: NotificationPayload): Promise<void>;
}
```

Even if Phase 1 only implements `web-push`, the interface must exist so Phase 2 can add `apns` and `fcm` without touching service logic.

### 🟡 Risk 4 — CORS configured to block requests without an Origin header

**Why this matters:** Browsers always send an `Origin` header with CORS requests. Native apps (React Native, Swift, Kotlin) do not send an `Origin` header at all — they are not browsers. A CORS configuration that only allows specific origins may inadvertently block native clients.

**Rule:** The CORS configuration in NestJS must allow requests with no `Origin` header (which is what native apps produce). This is typically done by including `null` or omitting the origin check for non-browser clients:

```typescript
// main.ts
app.enableCors({
  origin: (origin, callback) => {
    const allowed = [process.env.WEB_ORIGIN, process.env.WEB_ORIGIN_PROD];
    // Allow requests with no origin (native apps, curl, Postman)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
```

### 🟡 Risk 5 — Offset-based pagination only

**Current state:** All list endpoints use `?page=1&limit=20` offset pagination.

**Why this matters for native apps:** Mobile lists (infinite scroll) work better with cursor-based pagination because offset pagination can return duplicate or skipped items when records are inserted/deleted between pages. For Phase 1 with 22 users this is unlikely to cause real problems, but the time entry feed and photo gallery will be the first places this hurts.

**Recommendation:** Keep offset pagination for Phase 1 (it is fine at this scale). Add `cursor`-based pagination as an alternative for `GET /time-entries` and `GET /photos` before the native app is built. The API can support both simultaneously.

### 🟡 Risk 6 — Language stored only in JWT payload

**Current state:** Employee language preference is read from the JWT payload by the frontend. On language change, a new token must be issued.

**Why this matters for native apps:** Native apps cache JWTs and do not always force a refresh. If a user changes language in the native app settings and the app reads language from the old JWT, the language won't update until the next token refresh.

**Rule:** The API must also return the employee's current `language` field in `GET /employees/me` response, independently of the JWT payload. Native apps should read language from the profile response, not from the JWT.

---

## 4. Required Engineering Rules

### 4.1 Backend Rules

| Rule | Detail |
|---|---|
| `POST /auth/refresh` accepts token in request body | In addition to cookie. Required for native clients. See §3 Risk 1. |
| No business logic in Next.js routes | All mutations go through NestJS `/api/v1/*` endpoints. |
| `NotificationService` abstracted from transport | Interface accepts `device_type: 'web-push' \| 'apns' \| 'fcm'`. Phase 1 implements web-push only. |
| CORS allows null origin | Native apps send no `Origin` header. Must not be blocked. |
| `GET /employees/me` returns full profile including `language` | Native apps must not rely on JWT payload for display preferences. |
| All endpoints return consistent `{ data, meta }` envelope for lists | Never return raw arrays. Native app clients rely on this structure. |
| Error responses always include `statusCode`, `error`, `message` | Optional `field` for field-level validation. Never return HTML error pages. |
| All timestamps as UTC ISO 8601 in API responses | e.g., `"2026-04-05T10:30:00.000Z"`. Never include server-side timezone offset in response. Let clients convert. |
| S3 presigned URL endpoints remain two-step | `upload-url` → direct S3 PUT → metadata POST. Works for all HTTP clients. |
| API versioning prefix `/api/v1/` must be maintained | Do not add unversioned endpoints. Native apps deployed to stores cannot be force-updated. |

### 4.2 API Contract Rules

| Rule | Detail |
|---|---|
| Never rename or remove fields from existing responses | Additive changes only (adding new optional fields is safe). |
| Enum values in API responses must remain stable | e.g., `ProjectStatus.Töös` — once shipped, cannot be renamed without a version bump. |
| Boolean fields must not become nullable | `gps_verified: boolean` must stay boolean, not `boolean \| null`. |
| `id` fields are always integers | Do not migrate to UUIDs without a versioned migration plan. If UUIDs are needed, add `public_id` as an additional field. |
| Pagination `meta` fields (`total`, `page`, `limit`) are always present | Even when result count is 0. |

### 4.3 Auth Rules

| Rule | Detail |
|---|---|
| Access token lifetime: 15 minutes | Short enough to limit exposure if token is leaked from native secure storage. |
| Refresh token: accept from cookie (web) OR request body (native) | Implement dual-mode in Phase 1. |
| Refresh token rotation on every use | Already planned. Prevents replay attacks from compromised native storage. |
| OTP via SMS is the primary login method | Do not add email-only flows that bypass phone. Native apps will depend on OTP. |
| Do not use session-based auth anywhere | JWT only. Sessions require server-side state that doesn't work well with horizontal scaling or native clients. |

### 4.4 File Upload Rules

| Rule | Detail |
|---|---|
| Never accept binary file data directly in API request body (multipart) | Presigned S3 URL only. A native app uploading a 15 MB photo via multipart through the NestJS proxy would time out on poor networks. |
| Presigned URL TTL: 15 minutes for upload, 1 hour for read | Already defined. Native apps may be slow on 3G — 15 minutes is sufficient. |
| `taken_at` timestamp is client-provided | Device captures the real capture time. Server must not override it with `now()`. |
| `gps_lat` and `gps_lng` are always separate fields | Never embed GPS in EXIF or in a single string field. |
| Thumbnail generation is server-side | Client sends original. Server generates thumbnail. Native apps don't need to pre-process images. |

### 4.5 Real-time (WebSocket) Rules

| Rule | Detail |
|---|---|
| Socket.io auth via `auth: { token }` handshake field | Already implemented. Works in React Native socket.io-client. |
| Graceful degradation if WebSocket unavailable | Timer display falls back to periodic REST polling (`GET /time-entries?active=true`). Native apps may background-suspend WebSocket connections. |
| Timer events carry full payload | `timer:started` includes `started_at` timestamp so a reconnecting client can reconstruct elapsed time without additional API calls. |
| Do not emit events that require browser APIs to process | Events are plain JSON. No `Blob`, `ArrayBuffer`, or browser-specific objects in Socket.io payloads. |

### 4.6 Shared Types Rules

| Rule | Detail |
|---|---|
| `packages/shared-types` has zero dependencies on React, Next.js, or browser APIs | Already enforced. Must stay this way. |
| Enums in shared-types match Prisma enums exactly | Same values, same casing. Prevents translation errors between layers. |
| All DTO interfaces exported from shared-types are reusable as native app model definitions | No web-only types mixed in. |
| Version shared-types with the API | When an API contract changes, bump `shared-types` version in `package.json`. Native app can pin a compatible version. |

### 4.7 Frontend Boundary Rules (PWA — Phase 1)

These rules keep the PWA thin enough that it can be replaced by a native app without backend changes.

| Rule | Detail |
|---|---|
| All data access goes through `lib/api-client.ts` | No direct `fetch()` calls scattered in components. One client, one place to replace. |
| All WebSocket interactions go through `lib/socket.ts` singleton | Same principle — one point of replacement. |
| PWA-specific APIs (getUserMedia, navigator.geolocation, service worker) must be isolated in dedicated modules | `lib/camera.ts`, `lib/geolocation.ts` — not inline in components. This makes it clear what a native app needs to replace. |
| No business computation in the frontend | Duration, overtime (ÜT), timesheet totals — all computed by the backend. Frontend only displays. |
| Language display logic reads from Zustand store, not from JWT directly | Token parsing logic isolated in `store/auth.store.ts`. |

### 4.8 Offline / Network Assumptions

| Rule | Detail |
|---|---|
| Timer state must survive a full page reload | Active timer is persisted on the server (open `TimeEntry` row with `ended_at = null`). On app restart, `GET /time-entries?active=true&employee_id=me` restores timer state. |
| Read-only offline mode is sufficient for Phase 1 | Cached project/task list via service worker. No offline writes. |
| Do not rely on `localStorage` for anything except UI preferences | Auth tokens: handled by cookies (web) or secure storage (native). Data: always from API. |
| Network errors must surface as user-visible messages, not silent failures | Especially for timer start/stop — a failed request must not leave the UI showing a running timer that the server doesn't know about. |

---

## 5. Recommended Additions to Current Docs

The following small changes to existing documentation will prevent future confusion. These are documentation-only — no code changes in Phase 1.

### 5.1 TECH_STACK.md — Update ADR-003

**Current text:**
> *Revisit: If field workers consistently report push notification failures on iOS, consider a React Native thin shell in Phase 2.*

**Replace with:**
> *Revisit trigger: If field workers on iOS Safari <16.4 consistently miss push notifications, or if the team grows beyond 30 field workers, evaluate React Native in Phase 2. When building native apps, the NestJS backend requires no changes — only the auth refresh flow (dual-mode cookie + body) and the NotificationService (add APNs/FCM transport) need to be extended.*

### 5.2 TECH_STACK.md — Add note to §7.1 JWT

Add after the Refresh Token block:

> **Native app readiness:** `POST /auth/refresh` must accept the refresh token both from the httpOnly cookie (web clients) and from the `refresh_token` field in the request body (future native clients). This dual-mode is implemented in Phase 1 so no backend change is needed when native apps are introduced.

### 5.3 ARCHITECTURE.md — Add CORS note to §5.1 Request Lifecycle

Add to the CORS middleware line:

> `CORS (configured origins — also permits requests with no Origin header for native app clients)`

### 5.4 CLAUDE.md — Add one rule to "Common Mistakes to Avoid"

Add:
> **11. Do not implement data mutations as Next.js Server Actions or Next.js API routes.** All mutations must go through `POST/PATCH/DELETE /api/v1/*` NestJS endpoints. Server Actions are web-only and cannot be called by future native apps.

---

## 6. Mobile Readiness Checklist

Use this checklist when reviewing any Phase 1 PR that touches auth, API contracts, or data flow.

### Auth
- [ ] `POST /auth/refresh` accepts refresh token from request body (not cookie only)
- [ ] OTP flow is the primary login method; no web-only auth bypasses
- [ ] `GET /employees/me` returns `language` and `time_format` in response body (not just JWT)

### API Contracts
- [ ] All list endpoints return `{ data: [], meta: { total, page, limit } }` — never raw arrays
- [ ] All timestamps in responses are UTC ISO 8601 strings
- [ ] All error responses are JSON with `statusCode`, `error`, `message`
- [ ] No endpoint returns HTML error pages
- [ ] No fields renamed or removed from existing response shapes
- [ ] All enum values are stable strings matching Prisma enums

### File Uploads
- [ ] No multipart binary upload endpoints — presigned S3 only
- [ ] `taken_at` is accepted from client, not overridden by server
- [ ] GPS stored as separate `gps_lat` / `gps_lng` numeric fields

### Real-time
- [ ] Socket.io auth uses `auth: { token }` handshake (not cookies)
- [ ] Timer events include enough data to reconstruct state on reconnect (`started_at`, `pause_durations`)
- [ ] App can restore active timer state on restart via REST fallback

### CORS / Infrastructure
- [ ] CORS config permits requests with no `Origin` header
- [ ] API base URL is `NEXT_PUBLIC_API_URL` env variable — not hardcoded anywhere in web app

### Notifications
- [ ] Push notification sending is behind a `NotificationService` interface
- [ ] `device_type` field exists in device registration model (`web-push | apns | fcm`)

### Shared Types
- [ ] `packages/shared-types` has no React, Next.js, or browser-API imports
- [ ] Enums match Prisma schema values exactly

### Frontend Boundaries
- [ ] No business logic in React components — all computed server-side
- [ ] Camera access isolated in `lib/camera.ts`
- [ ] Geolocation access isolated in `lib/geolocation.ts`
- [ ] All API calls go through `lib/api-client.ts`
- [ ] All WebSocket interactions go through `lib/socket.ts`
- [ ] No data mutations in Next.js Server Actions

---

## 7. Final Recommendation

**The Phase 1 backend is 85% ready for a future native app today.** The core architecture — REST API with versioning, JWT Bearer tokens, OTP login, presigned S3 uploads, Socket.io with JWT handshake — is already correct. A React Native app could consume the Phase 1 API with minimal friction.

**The one change that must be made in Phase 1 (not deferred):**

> `POST /auth/refresh` must support refresh token in the request body, not only from the httpOnly cookie. If this is not done in Phase 1, a native app will be completely unable to maintain a session without a backend change — which requires a re-deploy and a coordinated app store update.

**Everything else in this document is about avoiding habits** (business logic in Server Actions, binary multipart uploads, hardcoded origins) that would create rework later. None of it requires new features — just discipline in how Phase 1 is implemented.

**Estimated effort to add native app support in Phase 2 (given Phase 1 follows this document):**
- `NotificationService`: add APNs + FCM transport (~2 days)
- Device token registration endpoint: 1 endpoint (~0.5 days)
- React Native app shell consuming existing API: most of the work is UI, not backend

**If Phase 1 does not follow this document:**
- Refresh token rework: backend change + re-deploy + forced app update cycle
- Server Action mutations: rewrite to NestJS endpoints before native app can function
- CORS blockage: silent failures in native app with no clear error message

---

*Document maintained by LUMICO development team. Last updated: 2026-04-05.*
*Read alongside: CLAUDE.md, docs/TECH_STACK.md, docs/ARCHITECTURE.md*
