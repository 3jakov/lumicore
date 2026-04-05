# Tech Stack — LUMICO Field & Production Management Platform
**Version:** 1.0
**Date:** 2026-04-05

---

## Table of Contents

1. [Overview](#1-overview)
2. [Frontend](#2-frontend)
3. [Backend](#3-backend)
4. [Database](#4-database)
5. [Real-time Layer](#5-real-time-layer)
6. [File Storage](#6-file-storage)
7. [Authentication](#7-authentication)
8. [Mobile / PWA](#8-mobile--pwa)
9. [Internationalisation](#9-internationalisation)
10. [Infrastructure & DevOps](#10-infrastructure--devops)
11. [Tooling & DX](#11-tooling--dx)
12. [Dependency Version Table](#12-dependency-version-table)
13. [Decision Log](#13-decision-log)

---

## 1. Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser / PWA                    │
│           Next.js 14  +  Tailwind CSS               │
└──────────────┬──────────────────────┬───────────────┘
               │ REST (HTTPS)         │ WebSocket (WSS)
               ▼                      ▼
┌─────────────────────────────────────────────────────┐
│               NestJS API  (TypeScript)              │
│  Controllers → Services → Prisma ORM               │
└──────┬───────────────────────────────┬──────────────┘
       │ SQL (pg)                      │ S3 API
       ▼                               ▼
┌──────────────┐              ┌────────────────────┐
│  PostgreSQL  │              │  S3-compatible     │
│  (primary DB)│              │  (photos/docs)     │
└──────────────┘              └────────────────────┘
```

All services run in Docker containers. Development uses docker-compose. Production uses docker-compose with Nginx reverse proxy on a single VPS (scalable to container orchestration in Phase 2+).

---

## 2. Frontend

### 2.1 Core Framework: Next.js 14

**Chosen:** Next.js 14 (App Router)
**Language:** TypeScript (strict mode)

**Why Next.js 14:**
- App Router enables React Server Components — reduces JS bundle sent to mobile PWA clients, which is critical for field workers on 4G.
- Built-in image optimization for photo gallery thumbnails.
- Strong TypeScript support, file-based routing reduces boilerplate.
- Large ecosystem, well-documented, proven in production.
- SSR and streaming allow the dashboard to begin rendering before all data fetches complete.

**App Router conventions used:**
- `app/` directory with `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.
- Server Components for all read-heavy pages (project lists, timesheets).
- `'use client'` directive only where required: timer controls, live Praegu view, camera capture, document acknowledgement confirmation.

### 2.2 Styling: Tailwind CSS 3

**Why Tailwind:**
- Utility-first approach aligns with component-based Next.js architecture.
- Zero runtime CSS — important for PWA performance.
- Consistent design tokens out of the box (spacing, color, typography scales).
- Excellent DX: IntelliSense plugin, co-located styles with markup.

No CSS Modules, no styled-components, no Emotion. All styles are Tailwind utilities. Custom design tokens added to `tailwind.config.ts` if needed.

### 2.3 State Management

| Concern | Tool | Rationale |
|---|---|---|
| Server/async state | TanStack Query (React Query) v5 | Caching, background refetch, optimistic updates for mutations |
| Global client state | Zustand v4 | Lightweight; used only for: auth state, current user, active timer state, WebSocket connection state |
| Form state | React Hook Form + Zod | Type-safe forms, schema validation that mirrors backend DTOs |
| URL state | Next.js `useSearchParams` | Filters, pagination — bookmarkable URLs |

### 2.4 Key Frontend Libraries

| Library | Purpose |
|---|---|
| `@tanstack/react-query` | Server state, data fetching, cache |
| `zustand` | Minimal global state |
| `react-hook-form` | Form management |
| `zod` | Schema validation (shared with or mirroring backend DTOs) |
| `socket.io-client` | WebSocket connection to NestJS gateway |
| `date-fns` + `date-fns-tz` | Date manipulation; timezone-aware display in Europe/Tallinn |
| `@radix-ui/react-*` | Unstyled accessible UI primitives (Dialog, Select, Popover, etc.) |
| `lucide-react` | Icon set |
| `react-virtualized` or `@tanstack/react-virtual` | Virtualised timesheet grid (potentially 22 rows × 31 cols, fast enough without, but available) |
| `xlsx` (SheetJS) | Client-side Excel export fallback if needed |
| `next-pwa` | Service Worker + PWA manifest generation |

---

## 3. Backend

### 3.1 Core Framework: NestJS

**Chosen:** NestJS 10 + TypeScript (strict mode)
**Runtime:** Node.js 20 LTS

**Why NestJS:**
- Module/controller/service/repository architecture enforces separation of concerns — critical for a codebase maintained by AI agents.
- Built-in dependency injection makes services easily unit-testable with mocks.
- Decorators-first approach: `@Controller`, `@Get`, `@UseGuards`, `@Roles` — very readable route definitions.
- First-class WebSocket support via `@WebSocketGateway` (Socket.io integration built-in).
- OpenAPI/Swagger generation from decorators — useful for Codex to understand API shape without reading service code.

### 3.2 Validation

- `class-validator` + `class-transformer` on all DTOs.
- Global `ValidationPipe` with `whitelist: true` (strips unknown fields) and `forbidNonWhitelisted: true`.
- Custom pipes for complex validations (e.g., time entry start/stop constraints).

### 3.3 API Design

- RESTful. Base prefix: `/api/v1`.
- Pagination via `?page=1&limit=20` query params. Default limit: 20. Max limit: 100.
- Filtering via typed query params (e.g., `?status=Töös&project_id=42`).
- Sorting via `?sort_by=created_at&sort_dir=desc`.
- Response envelope for lists: `{ data: [], meta: { total, page, limit } }`.
- Swagger UI auto-generated at `/api/docs` (disabled in production or behind auth).

---

## 4. Database

### 4.1 Primary Database: PostgreSQL 15

**Why PostgreSQL:**
- ACID transactions — essential for time entry start/stop atomicity.
- `timestamptz` type stores all timestamps as UTC with timezone awareness.
- Full-text search available natively (for project/task search without external search service in Phase 1).
- JSON/JSONB columns available for flexible data (custom fields in Phase 2).
- Excellent support in Prisma ORM.
- Widely hosted; available on any Estonian cloud provider.

### 4.2 ORM: Prisma

**Why Prisma:**
- Type-safe query builder — TypeScript types generated from schema, so any schema change breaks compilation immediately.
- Schema-as-code (`schema.prisma`) is readable and reviewable by both Claude Code and Codex.
- Migration system tracks schema evolution with full history.
- `prisma studio` provides a visual DB browser for debugging during development.
- Excellent NestJS integration via `@prisma/client`.

**Prisma conventions:**
```prisma
// All models:
model Project {
  id         Int      @id @default(autoincrement())
  // ... fields ...
  created_at DateTime @default(now()) @db.Timestamptz
  updated_at DateTime @updatedAt @db.Timestamptz
}

// Soft delete pattern:
archived_at DateTime? @db.Timestamptz
// Query filter: where: { archived_at: null }
```

### 4.3 Connection Pooling

- PgBouncer in transaction pooling mode in production (Docker container).
- Prisma configured with `connection_limit` appropriate for pooler.
- Direct connections for migrations only.

### 4.4 Indexes

Critical indexes to add in migrations (not auto-generated by Prisma):
```sql
-- Time entries: most frequent queries
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, started_at);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_no_project ON time_entries(project_id) WHERE project_id IS NULL;

-- Projects: filtering by status
CREATE INDEX idx_projects_status ON projects(status);

-- Tasks: filtering by project and status
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);

-- Photos: filtering by project
CREATE INDEX idx_photos_project ON photos(project_id);
```

---

## 5. Real-time Layer

### 5.1 WebSocket: Socket.io

**Chosen:** Socket.io 4 (via NestJS `@nestjs/platform-socket.io`)

**Why Socket.io over raw WebSocket:**
- Automatic reconnection with exponential backoff built in.
- Room/namespace support: each project gets a room; Praegu view subscribes to global timer events.
- Falls back to HTTP long-polling if WebSocket is blocked (some Estonian corporate networks).
- NestJS has a native `@WebSocketGateway` decorator that integrates cleanly.

**Rooms:**
- `timers` — all connected admin/manager clients subscribe for Praegu live view (timer:started/stopped/paused/resumed events).
- Phase 2 will add `project:{id}` and `chat:{conversation_id}` rooms for Chat/Vestlus. No chat rooms in Phase 1.

**Authentication:**
- JWT passed in handshake `auth: { token }`.
- Gateway validates token in `handleConnection()`, disconnects invalid clients.

---

## 6. File Storage

### 6.1 S3-compatible Object Storage

**Chosen:** AWS S3 (production) / MinIO (local development)

**Why S3-compatible:**
- Photos and documents can be large (up to 20 MB per photo). Database binary storage is not scalable.
- S3 pre-signed URLs allow direct client-to-storage uploads (bypasses API server for large files).
- Signed read URLs with expiry (1 hour) prevent public hotlinking of project photos.
- MinIO is a self-hosted S3-compatible alternative — exact same SDK, zero cost for development.

**Bucket structure:**
```
lumico-files/
├── photos/
│   ├── {year}/{month}/{uuid}.jpg
│   └── thumbnails/{year}/{month}/{uuid}_thumb.jpg
└── documents/
    └── projects/{project_id}/{uuid}_{original_filename}
```

**Upload flow (photos):**
1. Client requests pre-signed PUT URL from API: `POST /api/v1/photos/upload-url`.
2. Client uploads directly to S3 using the pre-signed URL.
3. Client sends metadata to API: `POST /api/v1/photos` with `{ s3_key, project_id, task_id, gps_lat, gps_lng, taken_at }`.
4. API generates thumbnail server-side (Sharp library) and stores thumbnail key.
5. API returns the Photo record with signed read URLs.

**Thumbnail generation:** `sharp` npm package. Resize to 320×240, JPEG quality 80.

---

## 7. Authentication

### 7.1 JWT with Refresh Tokens

**Access Token:**
- Algorithm: HS256 (symmetric — adequate for single-service architecture).
- Expiry: 15 minutes.
- Payload: `{ sub: employeeId, roles: ['Administraator'], group: 'Kontor', iat, exp }`.
- Sent in: `Authorization: Bearer <token>` header.

**Refresh Token:**
- Expiry: 7 days.
- Rotated on every use (refresh token rotation prevents replay attacks).
- Stored in DB as a SHA-256 hash to allow server-side revocation.
- **Dual-mode delivery (Phase 1 requirement):**
  - **Web/PWA:** Set as httpOnly, Secure, SameSite=Strict cookie. Browser sends it automatically on every request to `/auth/refresh`.
  - **Native apps (future):** Also returned as `{ refresh_token: "..." }` in the JSON response body. Native app stores it in secure device storage (Keychain/Keystore) and sends it as `{ refresh_token }` in the request body.
  - Both modes are implemented from day one — no backend change needed when native apps are built.

**`POST /auth/refresh` — dual-mode controller logic:**
```typescript
// auth.controller.ts
@Post('refresh')
async refresh(
  @Req() req: Request,
  @Body() body: RefreshTokenDto,   // { refresh_token?: string }
  @Res({ passthrough: true }) res: Response,
) {
  // Cookie takes priority (web); fall back to body field (native)
  const incomingToken = req.cookies?.refresh_token ?? body.refresh_token;
  if (!incomingToken) throw new UnauthorizedException('No refresh token provided');

  const { accessToken, refreshToken } = await this.authService.refreshTokens(incomingToken);

  // Always set cookie (keeps web sessions working)
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Always return in body (native clients use this; web clients can ignore it)
  return { access_token: accessToken, refresh_token: refreshToken };
}
```

**Security properties maintained in both modes:**
- HTTPS required in production (both modes transmit token over TLS).
- Token rotation on every use: old token is invalidated immediately.
- DB hash comparison: stolen token from a compromised DB is useless without the plaintext.
- Cookie mode additionally protected by SameSite=Strict (CSRF immune).
- Body mode security relies on native secure storage (Keychain/Keystore) — acceptable for a controlled employee app.

**Phone OTP Flow:**
1. `POST /api/v1/auth/otp/request` — employee provides phone number. System sends 6-digit OTP via SMS (Twilio or local Estonian SMS provider).
2. OTP stored in Redis with 5-minute TTL (hashed, not plaintext).
3. `POST /api/v1/auth/otp/verify` — employee provides phone + OTP. System validates and returns access + refresh tokens.

**Email+Password Flow:**
- bcrypt password hashing (rounds: 12).
- Rate limiting: max 5 failed attempts per 15 minutes per IP.

### 7.2 Guards

```typescript
// Applied globally via APP_GUARD:
JwtAuthGuard     // validates access token, sets req.user

// Applied per-route:
RolesGuard       // checks req.user.roles against @Roles() decorator
ProjectAccessGuard // checks employee.project_access for project-scoped routes
```

---

## 8. Mobile / PWA

### 8.1 Progressive Web App (Phase 1)

**Why PWA over native:**
- ~22 employees. Native app publishing, device management, and update distribution overhead is not justified.
- PWA installs from browser on both Android and iOS.
- Camera API (`getUserMedia`) available in all modern mobile browsers.
- Geolocation API available in all modern mobile browsers.
- Web Push notifications available on Android Chrome; iOS Safari 16.4+ (limited but sufficient).

**PWA Features:**
- **Service Worker** (via `next-pwa`): caches static assets and recent API responses. Task list and project list viewable offline (read-only).
- **App Manifest**: home screen install, full-screen display, LUMICO icon and brand colors.
- **Push Notifications**: Web Push via VAPID keys. Notification types: task assigned, timer reminder (>8h running). Chat notifications are Phase 2.
- **Camera**: `getUserMedia({ video: { facingMode: 'environment' } })` — rear camera default. Canvas capture → Blob → direct S3 upload. Photos never touch device gallery.
- **GPS**: `navigator.geolocation.getCurrentPosition()` called at photo capture time. 10-second timeout with fallback (photo saved without GPS, gps_verified = false).

**Minimum supported browsers:**
- Android Chrome 90+
- iOS Safari 15+
- Desktop: Chrome 90+, Firefox 90+, Edge 90+

---

## 9. Internationalisation

### 9.1 ET + RU (Estonian + Russian)

**Implementation:** Custom lightweight i18n using a `useTranslation()` hook.

No external i18n library (next-intl, react-i18next) in Phase 1 — team is small, string count is manageable, and a custom solution avoids abstraction overhead.

**Structure:**
```typescript
// lib/i18n/et.ts
export const et = {
  'projects.status.Hinnapakkumises': 'Hinnapakkumises',
  'projects.status.Töös': 'Töös',
  'tasks.priority.Kõrgeim': 'Kõrgeim',
  'nav.projects': 'Projektid',
  'nav.tasks': 'Tööd',
  // ...
};

// lib/i18n/ru.ts
export const ru = {
  'projects.status.Hinnapakkumises': 'На рассмотрении',
  'projects.status.Töös': 'В работе',
  'tasks.priority.Kõrgeim': 'Наивысший',
  'nav.projects': 'Проекты',
  'nav.tasks': 'Работы',
  // ...
};
```

**Language switch:** employee updates `language` field in profile (`PATCH /api/v1/employees/me`). Language stored in JWT payload. On next login or token refresh, UI re-renders in new language. Immediate re-render via Zustand language state update.

**Date/time localisation:**
- `date-fns/locale/et` for Estonian locale formatting.
- `date-fns/locale/ru` for Russian locale formatting.
- Applied in all `format()` calls: `format(date, 'dd.MM.yyyy', { locale: currentLocale })`.

---

## 10. Infrastructure & DevOps

### 10.1 Docker

Every service runs in a Docker container. `docker-compose.yml` for development; `docker-compose.prod.yml` for production.

**Development compose services:**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    volumes: [./data/postgres:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: lumico
      POSTGRES_USER: lumico
      POSTGRES_PASSWORD: dev_password

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes: [./data/minio:/data]

  redis:
    image: redis:7-alpine
    # Used for: OTP storage, rate limiting, Socket.io adapter in production

  api:
    build: ./apps/api
    depends_on: [postgres, redis, minio]
    ports: ["3001:3001"]
    volumes: [./apps/api:/app]  # hot reload in dev

  web:
    build: ./apps/web
    depends_on: [api]
    ports: ["3000:3000"]
    volumes: [./apps/web:/app]
```

**Production additions:**
- Nginx reverse proxy container (SSL termination, HTTP→HTTPS redirect, static file serving).
- PgBouncer container for connection pooling.
- Let's Encrypt via certbot container (or external load balancer).

### 10.2 CI/CD: GitHub Actions

**Workflow: CI (`.github/workflows/ci.yml`)** — runs on every PR:
1. Type-check all packages.
2. Run backend unit tests (Jest).
3. Run backend e2e tests (against test PostgreSQL service container).
4. Build Next.js frontend (catch build errors early).
5. Lint all packages (ESLint).

**Workflow: Deploy (`.github/workflows/deploy.yml`)** — runs on merge to `main`:
1. Build Docker images (api + web).
2. Tag with git SHA.
3. Push to container registry (GitHub Container Registry, free).
4. SSH to production VPS.
5. `docker-compose pull && docker-compose up -d --no-build`.
6. Run `prisma migrate deploy` (applies pending migrations).

### 10.3 Hosting

**Development:** Local machines via docker-compose.
**Production:** Single VPS (Estonian cloud provider preferred — e.g., UpCloud Tallinn or Hetzner Helsinki for data residency). Minimum spec: 4 vCPU, 8 GB RAM, 100 GB SSD.

**Rationale for single VPS in Phase 1:**
- 22 employees is a small concurrent user base.
- Keeps infrastructure cost low (~€20–40/month vs €200+ for managed Kubernetes).
- Easily migrated to container orchestration if the team grows.

### 10.4 Backups

- PostgreSQL: daily `pg_dump` at 02:00 Europe/Tallinn, uploaded to S3 bucket `lumico-backups`.
- S3 photos/documents: S3 versioning enabled. Cross-region replication optional (Phase 2).
- Retention: 30 days of daily backups.

### 10.5 Monitoring

Phase 1 (minimal):
- Docker health checks on all containers.
- Uptime monitoring via UptimeRobot (free tier) — alert on API and web downtime.
- Application logs via Docker logging driver → file, rotated weekly.

Phase 2 (when needed):
- Structured logging with Pino → centralized log aggregation (Grafana Loki or Logtail).
- APM: Sentry for error tracking (frontend + backend).

---

## 11. Tooling & DX

### 11.1 Package Manager

**pnpm** with workspace protocol (`pnpm-workspace.yaml`). Monorepo with three packages: `apps/api`, `apps/web`, `packages/shared-types`.

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 11.2 TypeScript

Strict mode enabled in all packages:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 11.3 Linting & Formatting

- **ESLint**: `@typescript-eslint/recommended` + Next.js config for web, standard NestJS config for api.
- **Prettier**: consistent formatting. Config in root `.prettierrc`.
- **Husky + lint-staged**: pre-commit hook runs ESLint + Prettier on staged files.

### 11.4 Testing

| Layer | Tool |
|---|---|
| Backend unit tests | Jest + `jest-mock-extended` (Prisma mock) |
| Backend e2e tests | Jest + `@nestjs/testing` + real PostgreSQL in CI |
| Frontend unit tests | Vitest + React Testing Library |
| Frontend e2e tests | Playwright (Phase 2) |

### 11.5 API Documentation

- Swagger/OpenAPI: auto-generated from NestJS decorators at `/api/docs`.
- `@nestjs/swagger` decorators on all DTOs and controllers.
- Useful for Codex to introspect the API without reading service code.

---

## 12. Dependency Version Table

| Package | Version | Used in |
|---|---|---|
| Node.js | 20 LTS | runtime |
| TypeScript | 5.4 | all |
| Next.js | 14.2 | web |
| React | 18.3 | web |
| Tailwind CSS | 3.4 | web |
| @tanstack/react-query | 5.x | web |
| Zustand | 4.x | web |
| React Hook Form | 7.x | web |
| Zod | 3.x | web |
| socket.io-client | 4.x | web |
| date-fns | 3.x | web + api |
| date-fns-tz | 3.x | web + api |
| @radix-ui/react-* | latest | web |
| lucide-react | latest | web |
| next-pwa | 5.x | web |
| NestJS | 10.x | api |
| @nestjs/platform-express | 10.x | api |
| @nestjs/websockets | 10.x | api |
| @nestjs/platform-socket.io | 10.x | api |
| @nestjs/swagger | 7.x | api |
| socket.io | 4.x | api |
| Prisma | 5.x | api |
| @prisma/client | 5.x | api |
| class-validator | 0.14.x | api |
| class-transformer | 0.5.x | api |
| bcrypt | 5.x | api |
| jsonwebtoken | 9.x | api |
| sharp | 0.33.x | api (thumbnails) |
| @aws-sdk/client-s3 | 3.x | api |
| PostgreSQL | 15 | database |
| Redis | 7 | OTP cache, rate limit |
| MinIO | latest | local S3 replacement |
| Jest | 29.x | api tests |
| Vitest | 1.x | web tests |

---

## 13. Decision Log

### ADR-001: Next.js App Router over Pages Router
**Decision:** Use App Router (introduced in Next.js 13, stable in 14).
**Reason:** Server Components reduce JavaScript sent to field workers on mobile. Streaming enables faster perceived performance for dashboard loads.
**Trade-off:** App Router is newer; some third-party libraries still have limited RSC support. Mitigated by using `'use client'` wrapper components where needed.

### ADR-002: Prisma over TypeORM
**Decision:** Prisma ORM.
**Reason:** Prisma generates TypeScript types from schema — any schema change immediately surfaces as type errors throughout the codebase. TypeORM's decorator-based approach requires decorators on every entity class, which is verbose and error-prone with strict TypeScript. Prisma's migration system is cleaner.
**Trade-off:** Prisma does not support all DB features natively (e.g., complex stored procedures). Mitigation: use `$queryRaw` sparingly for complex analytics queries.

### ADR-003: PWA over Native App
**Decision:** Progressive Web App for Phase 1.
**Reason:** Team of 22 does not justify App Store/Play Store publishing, code signing, and device management overhead. PWA covers camera, GPS, and push notifications on modern devices.
**Trade-off:** iOS Safari Web Push was limited before iOS 16.4. Current minimum iOS 15 means some users may not receive push notifications. Acceptable for Phase 1 — the only push notification types in Phase 1 are task assignments and timer reminders, not real-time chat.
**Revisit trigger:** If field workers on iOS Safari <16.4 consistently miss push notifications, or if the team grows beyond 30 field workers, evaluate React Native in Phase 2. When building native apps, the NestJS backend requires no changes — only the auth refresh flow (dual-mode cookie + body) and the NotificationService (add APNs/FCM transport) need to be extended. See `docs/MOBILE_READINESS.md`.

### ADR-004: Socket.io over raw WebSocket
**Decision:** Socket.io with NestJS gateway.
**Reason:** Automatic reconnection, room support, and HTTP long-polling fallback outweigh the small bundle size overhead of the Socket.io client.

### ADR-005: Single VPS over Managed Cloud
**Decision:** Single VPS (UpCloud/Hetzner) over AWS ECS or managed Kubernetes.
**Reason:** 22 concurrent users. Managed cloud is 5–10x more expensive for this scale. docker-compose on a VPS is transparent, auditable, and easy for any developer to understand and maintain.
**Revisit trigger:** If team grows beyond 50 users or response times degrade, migrate to container orchestration.

### ADR-006: Custom i18n over next-intl
**Decision:** Lightweight custom `useTranslation()` hook with plain TS translation files.
**Reason:** Only two locales (ET, RU), ~200 strings estimated. next-intl adds complexity (ICU message format, routing locale prefixes) that is unnecessary at this scale.
**Revisit:** If string count exceeds 500 or a third language is needed, migrate to next-intl.

### ADR-007: S3 pre-signed upload vs. proxy upload
**Decision:** Direct S3 upload via pre-signed PUT URLs.
**Reason:** Photos up to 20 MB. Proxying through the NestJS API would saturate server bandwidth and memory. Pre-signed URLs offload bandwidth to S3 and reduce API server load.
**Trade-off:** Metadata must be sent in a separate POST after the S3 upload. Mitigated by a clean two-step flow in the frontend upload component.
