# Implementation Plan — LUMICO Phase 1: Operations Core
**Version:** 1.0
**Date:** 2026-04-05
**Status:** Active
**Source of truth:** CLAUDE.md, docs/PRD.md, docs/TECH_STACK.md, docs/ARCHITECTURE.md

---

## Table of Contents

1. [Objective](#1-objective)
2. [Phase 1 Scope Summary](#2-phase-1-scope-summary)
3. [Delivery Principles](#3-delivery-principles)
4. [Epics](#4-epics)
5. [Milestones](#5-milestones)
6. [Task Breakdown by Area](#6-task-breakdown-by-area)
7. [Dependency Map](#7-dependency-map)
8. [Recommended Implementation Order](#8-recommended-implementation-order)
9. [Parallel Work Split](#9-parallel-work-split)
10. [Definition of Done per Milestone](#10-definition-of-done-per-milestone)
11. [Immediate Next 10 Tasks](#11-immediate-next-10-tasks)

---

## 1. Objective

Deliver a working, deployable, bilingual (ET/RU) field management platform that replaces Remato for LUMICO's ~22 employees. The platform must enforce mandatory project linkage on every time entry, provide real-time team visibility, and support GPS photo documentation from mobile devices.

**Hard constraint:** Zero unassigned time entries (344 h problem from Remato must not exist in this system).

---

## 2. Phase 1 Scope Summary

| Module | Core Deliverable |
|---|---|
| Auth | OTP phone login + email/password, JWT, invitations |
| Projects | CRUD + 4 statuses + client sub-object + tags |
| Tasks | CRUD + 19 templates + Kanban status |
| Time Tracking | Timer start/stop/pause + manual entry + timesheet grid + Excel export |
| Team (Meeskond) | Praegu live view + Töögraafik + Tunnitabel + Inimesed |
| Gallery | GPS photo capture (PWA) + company-wide gallery |
| Documents | Per-project file upload/download |
| Tools | Basic list + status + assign to project/task |
| Settings | Roles, tags, company info, task templates |
| Infrastructure | Docker, CI/CD, VPS deployment |
| PWA | Service worker, manifest, camera, push notifications |
| i18n | ET + RU, language per employee profile |

**Out of scope (Phase 2):** Eelarve/budget, standalone CRM client entity, custom fields (Lisaväljad), materials module, accounting integration, Chat/Vestlus (internal messaging).

---

## 3. Delivery Principles

1. **Backend-first on shared contracts.** Claude Code writes Prisma schema and shared-types before Codex builds any UI that consumes them.
2. **Business rules enforced server-side.** BR-001 (no project without reason), BR-002 (no zero duration) — these live in services, not just DTOs or UI.
3. **No duration in API requests.** Duration is always computed server-side from `started_at`, `ended_at`, and pause records.
4. **Soft delete only.** Projects, employees, tasks, tools use `archived_at`. No `DELETE` for business entities.
5. **Feature branches per epic.** Each epic = one feature branch, merged to `develop` via PR.
6. **Tests alongside code.** Every service file ships with a `.spec.ts` covering all business rules. No deferred testing.
7. **API contract changes require shared-types update first.** See cross-agent protocol in CLAUDE.md.

---

## 4. Epics

| Epic | ID | Owner | Depends on |
|---|---|---|---|
| Monorepo & Infrastructure Setup | E0 | Claude Code | — |
| Database Schema & Shared Types | E1 | Claude Code | E0 |
| Authentication | E2 | Claude Code | E1 |
| Projects Module | E3 | Both | E2 |
| Tasks Module | E4 | Both | E2 |
| Time Tracking | E5 | Both | E3, E4 |
| Team / Employees | E6 | Both | E2 |
| Gallery & Photos | E7 | Both | E3 |
| Documents | E8 | Both | E3 |
| Tools | E9 | Both | E2 |
| Document Acknowledgement | E10 | Both | E2, E6 |
| Settings | E11 | Both | E2 |
| PWA & i18n | E12 | Codex | E2 |
| CI/CD & Deployment | E13 | Claude Code | E0 |

---

## 5. Milestones

### M0 — Foundation (Estimated: 3–4 days)
Everything needed to write code. No features yet.
- Monorepo structure with pnpm workspaces
- Docker Compose (postgres, redis, minio, api, web)
- Prisma schema — all models, all relations, all indexes
- `packages/shared-types` — all interfaces and enums
- GitHub Actions CI skeleton (typecheck + lint)
- `.env` templates for both apps

### M1 — Auth + Core Shell (Estimated: 4–5 days)
Employees can log in. Frontend shell exists. No business features yet.
- Backend: OTP flow (Redis), email+password login, JWT, refresh token rotation
- Backend: JwtAuthGuard, RolesGuard, ProjectAccessGuard
- Backend: Employee invite (SMS + email stubs)
- Frontend: Login page, AppShell layout (sidebar, header)
- Frontend: Auth store (Zustand), api-client.ts, token refresh logic

### M2 — Projects + Tasks (Estimated: 5–6 days)
Managers can create projects and tasks.
- Backend: Projects CRUD + status logic + prefix auto-assign (QUOT/P)
- Backend: Tasks CRUD + 19 templates seeded
- Frontend: Project list, project create/edit form, project detail page (tabs skeleton)
- Frontend: Task list, task create/edit form, task templates selector
- Shared: Project and Task types finalized

### M3 — Time Tracking (Estimated: 6–7 days) ⚠️ CRITICAL PATH
Core product value. Must work correctly before anything else goes live.
- Backend: Timer start (BR-001 enforced), pause, resume, stop (BR-002 enforced)
- Backend: Duration computed server-side (never from request body)
- Backend: Manual entry with `is_manual` flag
- Backend: Timesheet computation (Kokku, TP, NT, ÜT, timezone-aware)
- Backend: Excel export (SheetJS or exceljs)
- Backend: WebSocket gateway (timer:started, timer:stopped, timer:paused, timer:resumed)
- Frontend: TimerStartModal (project selector + no-project toggle + reason field)
- Frontend: Live timer display, pause/resume/stop controls
- Frontend: Time entry list with filters
- Frontend: Tunnitabel grid (sticky header, negative ÜT in red)
- Frontend: Export button

### M4 — Team + Employees (Estimated: 4–5 days)
Full people management and live view.
- Backend: Employees CRUD, archive, sensitive field guard
- Backend: Praegu endpoint (active timers snapshot)
- Frontend: Praegu live view (WebSocket, client-side elapsed counter)
- Frontend: Töögraafik (work schedule calendar)
- Frontend: Employee list + employee detail/edit form

### M5 — Gallery + Documents (Estimated: 4–5 days)
Photo capture and file storage.
- Backend: Photo presigned URL flow, metadata save, thumbnail generation (sharp)
- Backend: Documents presigned URL flow, metadata save
- Frontend: PhotoCapture (getUserMedia, canvas, GPS, no gallery save)
- Frontend: PhotoGrid + Lightbox
- Frontend: Documents tab (upload, list, download)

### M6 — Tools + Doc Acknowledgement + Settings (Estimated: 4–5 days)
Remaining modules.
- Backend: Tools CRUD
- Backend: Document Acknowledgement (internal docs, assignments, compliance matrix)
- Backend: Settings (tags, roles, company, task templates CRUD)
- Frontend: Tools list + tool detail
- Frontend: Doc Acknowledgement (employee view + admin compliance matrix)
- Frontend: Settings pages (profile, company, tags, roles, templates)

### M7 — PWA + i18n + Polish (Estimated: 3–4 days)
Mobile readiness and bilingual support.
- PWA manifest, service worker (next-pwa), home screen install
- Push notification VAPID setup + notification types
- ET/RU translation files complete
- `useTranslation()` hook wired everywhere
- Offline read-only mode (cached project/task list)

### M8 — Testing + Deployment (Estimated: 3–4 days)
Ship to production.
- Full CI pipeline (typecheck, unit tests, e2e tests, build)
- Production docker-compose (nginx, pgbouncer, certbot)
- GitHub Actions deploy workflow
- Seed script (19 templates, admin user, 4 groups, 5 roles)
- Smoke test on production VPS

**Total estimated: ~36–41 working days (one developer pace; parallelism reduces calendar time)**

---

## 6. Task Breakdown by Area

### 6.1 Backend (Claude Code)

#### E0: Infrastructure
- [ ] `BE-001` Init monorepo: `pnpm-workspace.yaml`, root `tsconfig.json`, `.prettierrc`, `.eslintrc`
- [ ] `BE-002` Create `apps/api` NestJS project (NestJS CLI, strict TypeScript)
- [ ] `BE-003` `docker-compose.yml` with postgres:15, redis:7, minio, api service
- [ ] `BE-004` `apps/api/.env.example` with all required variables
- [ ] `BE-005` NestJS global setup: `ValidationPipe` (whitelist, forbidNonWhitelisted), CORS, Swagger at `/api/docs`

#### E1: Database + Prisma
- [ ] `BE-006` Write full `prisma/schema.prisma` (all models from ARCHITECTURE.md §4)
- [ ] `BE-007` Run initial migration: `20260405_initial_schema`
- [ ] `BE-008` Add all performance indexes (time_entries, projects, tasks, photos — see TECH_STACK.md §4.4)
- [ ] `BE-009` `prisma/seed.ts`: 19 task templates, admin employee, 5 roles, 4 groups (idempotent)
- [ ] `BE-010` `DatabaseModule` (global Prisma service)

#### E2: Auth
- [ ] `BE-011` `AuthModule` scaffold
- [ ] `BE-012` `JwtStrategy` + `JwtAuthGuard`
- [ ] `BE-013` `RolesGuard` + `@Roles()` decorator
- [ ] `BE-014` `ProjectAccessGuard`
- [ ] `BE-015` `POST /auth/otp/request` — store hashed OTP in Redis (5 min TTL)
- [ ] `BE-016` `POST /auth/otp/verify` — validate OTP; set httpOnly cookie **and** return `{ access_token, refresh_token }` in body (dual-mode; see CLAUDE.md `issueTokenResponse` helper)
- [ ] `BE-017` `POST /auth/login` — email+password (bcrypt), rate limit 5/15min per IP; same dual-mode response as BE-016
- [ ] `BE-018` `POST /auth/refresh` — accept token from cookie (priority) OR `{ refresh_token }` body field; rotate token; dual-mode response; implement `RefreshTokenDto` with optional `refresh_token` field
- [ ] `BE-019` `POST /auth/logout` — invalidate refresh token
- [ ] `BE-020` `InvitationService` — SMS stub + email stub (configurable via env)
- [ ] `BE-021` `SensitiveFieldsInterceptor` — strips `hourly_rate`, `personal_id`, `birth_date` for non-admin
- [ ] `BE-022` Unit tests: auth service (OTP expiry, wrong OTP, rate limit logic)

#### E3: Projects
- [ ] `BE-023` `ProjectsModule` scaffold
- [ ] `BE-024` `GET /projects` — list with filters (status, tags, manager, date range), pagination
- [ ] `BE-025` `POST /projects` — create; auto-prefix (QUOT/P based on status, BR-004)
- [ ] `BE-026` `GET /projects/:id` — single project with all relations
- [ ] `BE-027` `PATCH /projects/:id` — partial update; prefix recalculated on status change (BR-004)
- [ ] `BE-028` `DELETE /projects/:id` — soft delete (set `archived_at`)
- [ ] `BE-029` Unit tests: prefix logic (BR-004), soft delete

#### E4: Tasks
- [ ] `BE-030` `TasksModule` scaffold
- [ ] `BE-031` `GET /tasks` — list with filters, pagination
- [ ] `BE-032` `POST /tasks` — create with optional project_id
- [ ] `BE-033` `GET /tasks/:id`
- [ ] `BE-034` `PATCH /tasks/:id`
- [ ] `BE-035` `DELETE /tasks/:id` — soft delete
- [ ] `BE-036` `GET /tasks/templates` — list seeded templates
- [ ] `BE-037` Unit tests: task without project (valid), template lookup

#### E5: Time Tracking ⚠️ CRITICAL
- [ ] `BE-038` `TimeTrackingModule` scaffold
- [ ] `BE-039` `POST /time-entries` — start timer; enforce BR-001 (project+task OR reason ≥10 chars); check no open timer exists for employee
- [ ] `BE-040` `POST /time-entries/:id/pause` — record pause_start; emit `timer:paused`
- [ ] `BE-041` `POST /time-entries/:id/resume` — record pause_end; emit `timer:resumed`
- [ ] `BE-042` `POST /time-entries/:id/stop` — compute duration server-side; enforce BR-002 (no zero duration); emit `timer:stopped`
- [ ] `BE-043` `PATCH /time-entries/:id` — update notes, needs_review; NEVER accept duration from body
- [ ] `BE-044` `GET /time-entries` — list with filters (employee, project, date range)
- [ ] `BE-045` `GET /time-entries/timesheet` — monthly grid, Europe/Tallinn TZ, Kokku/TP/NT/ÜT
- [ ] `BE-046` `GET /time-entries/timesheet/export` — Excel download
- [ ] `BE-047` `TimeTrackingGateway` — Socket.io gateway; emit timer:started/stopped/paused/resumed to `timers` room
- [ ] `BE-048` Unit tests: BR-001 (missing project without reason), BR-002 (zero duration), duration computation with pauses, timesheet month boundary

#### E6: Employees
- [ ] `BE-049` `EmployeesModule` scaffold
- [ ] `BE-050` `GET /employees` — list (active only by default; archived toggle)
- [ ] `BE-051` `POST /employees` — create; trigger invite if phone/email provided (BR-007)
- [ ] `BE-052` `GET /employees/:id` — with sensitive field guard
- [ ] `BE-053` `PATCH /employees/:id` — update; trigger invite on first phone/email (BR-007)
- [ ] `BE-054` `PATCH /employees/me` — update own profile (language, name, time_format)
- [ ] `BE-055` `POST /employees/:id/archive` — soft archive
- [ ] `BE-056` Unit tests: BR-007 (invitation trigger), BR-013 (sensitive field stripping)

#### E7: Photos
- [ ] `BE-057` `PhotosModule` scaffold
- [ ] `BE-058` `POST /photos/upload-url` — generate presigned S3 PUT URL (15 min TTL), return `{ upload_url, s3_key }`
- [ ] `BE-059` `POST /photos` — save metadata; generate thumbnail (sharp 320×240); return photo with signed read URLs
- [ ] `BE-060` `GET /photos` — list with filters (project, employee, date range)
- [ ] `BE-061` S3 service wrapper (AWS SDK v3) — works against MinIO in dev

#### E8: Documents
- [ ] `BE-062` `DocumentsModule` scaffold
- [ ] `BE-063` `POST /documents/upload-url` — presigned S3 PUT URL
- [ ] `BE-064` `POST /documents` — save metadata (filename, size, mime_type, project_id, uploaded_by)
- [ ] `BE-065` `GET /documents` — list by project_id, with signed download URLs
- [ ] `BE-066` `DELETE /documents/:id` — hard delete (not a business entity; also delete from S3)

#### E9: Tools
- [ ] `BE-067` `ToolsModule` scaffold
- [ ] `BE-068` `GET /tools` — list with filters (status, location)
- [ ] `BE-069` `POST /tools` — create
- [ ] `BE-070` `GET /tools/:id`
- [ ] `BE-071` `PATCH /tools/:id` — update status, location, responsible employee

#### E10: Document Acknowledgement
- [ ] `BE-072` `DocAcknowledgementModule` scaffold
- [ ] `BE-073` `POST /internal-documents/upload-url` — presigned S3 PUT URL for internal doc upload
- [ ] `BE-074` `POST /internal-documents` — save metadata (title, category, s3_key, version=1)
- [ ] `BE-075` `GET /internal-documents` — admin list all documents
- [ ] `BE-076` `PATCH /internal-documents/:id` — update; if new s3_key provided, increment version (BR-017)
- [ ] `BE-077` `DELETE /internal-documents/:id` — soft archive (archived_at)
- [ ] `BE-078` `POST /internal-documents/:id/assign` — assign to specific employees and/or groups
- [ ] `BE-079` `GET /internal-documents/:id/status` — compliance matrix (assigned employees × ack status)
- [ ] `BE-080` `GET /internal-documents/my` — employee's own pending + acknowledged docs
- [ ] `BE-081` `POST /internal-documents/:id/acknowledge` — record acknowledgement (BR-016, BR-018)

#### E11: Settings
- [ ] `BE-078` `SettingsModule` scaffold
- [ ] `BE-079` Tags CRUD (`GET/POST /settings/tags`, `PATCH/DELETE /settings/tags/:id`)
- [ ] `BE-080` Roles CRUD (`GET/POST /settings/roles`, `PATCH/DELETE /settings/roles/:id`)
- [ ] `BE-081` Company settings (`GET/PATCH /settings/company`)
- [ ] `BE-082` Task templates CRUD (`GET/POST/PATCH /settings/templates/:id`)

#### E13: CI/CD
- [ ] `BE-083` `.github/workflows/ci.yml` — typecheck, unit tests, e2e tests (pg service container), Next.js build, lint
- [ ] `BE-084` `.github/workflows/deploy.yml` — build images, push to GHCR, SSH deploy, prisma migrate deploy
- [ ] `BE-085` `docker-compose.prod.yml` — nginx, pgbouncer, certbot, api, web
- [ ] `BE-086` Nginx config: SSL, HTTP→HTTPS, `/api/*` proxy, WebSocket upgrade

---

### 6.2 Frontend (Codex)

#### E0: Web App Setup
- [ ] `FE-001` Init `apps/web` (Next.js 14, App Router, TypeScript strict)
- [ ] `FE-002` Tailwind CSS config with status color tokens from CLAUDE.md
- [ ] `FE-003` `lib/api-client.ts` — typed fetch wrapper with auth header injection and token refresh
- [ ] `FE-004` `lib/socket.ts` — Socket.io singleton client
- [ ] `FE-005` Zustand stores: `auth.store.ts`, `timer.store.ts`, `socket.store.ts`
- [ ] `FE-006` `app/(auth)/login/page.tsx` — OTP flow + email/password form
- [ ] `FE-007` `app/(app)/layout.tsx` — AppShell: sidebar with all nav items, header with user menu
- [ ] `FE-008` `apps/web/.env.local.example`

#### E3: Projects UI
- [ ] `FE-009` `hooks/use-projects.ts` — React Query hooks (list, get, create, update, delete)
- [ ] `FE-010` `app/(app)/projects/page.tsx` — project list with filters + status badges
- [ ] `FE-011` `components/projects/ProjectForm.tsx` — create/edit drawer/modal
- [ ] `FE-012` `app/(app)/projects/[id]/page.tsx` — project detail with tab navigation (Tööd, Kalender, Dokumendid, Galerii, Eelarve placeholder)
- [ ] `FE-013` `components/projects/ProjectStatusBadge.tsx` — color-coded per CLAUDE.md

#### E4: Tasks UI
- [ ] `FE-014` `hooks/use-tasks.ts`
- [ ] `FE-015` `app/(app)/tasks/page.tsx` — task list (list view + calendar view tabs)
- [ ] `FE-016` `components/tasks/TaskForm.tsx` — with template picker, assignee multi-select
- [ ] `FE-017` `components/tasks/TaskStatusBadge.tsx` + `TaskPriorityBadge.tsx`

#### E5: Time Tracking UI ⚠️ CRITICAL
- [ ] `FE-018` `hooks/use-time-entries.ts` + `hooks/use-timer.ts`
- [ ] `FE-019` `components/timer/TimerStartModal.tsx` — project selector (searchable) + task selector (cascading) + no-project toggle + reason textarea (min 10 chars) + Start button disabled until valid
- [ ] `FE-020` `components/timer/TimerWidget.tsx` — floating persistent widget: live elapsed counter, pause/resume/stop buttons
- [ ] `FE-021` `app/(app)/time/page.tsx` — personal time entry list, manual entry form
- [ ] `FE-022` `app/(app)/team/timesheet/page.tsx` — Tunnitabel sticky grid (negative ÜT = `text-red-600 font-semibold`)
- [ ] `FE-023` Excel export button → `GET /time-entries/timesheet/export` → browser download

#### E6: Team UI
- [ ] `FE-024` `hooks/use-employees.ts`
- [ ] `FE-025` `app/(app)/team/praegu/page.tsx` — WebSocket live view, client-side elapsed counter per active employee, Zustand active timers map
- [ ] `FE-026` `app/(app)/team/people/page.tsx` — employee list (active/archived toggle)
- [ ] `FE-027` `app/(app)/team/people/[id]/page.tsx` — employee detail/edit; sensitive fields hidden for non-admin
- [ ] `FE-028` `components/team/EmployeeForm.tsx` — create/edit with role multi-select, group select, project_access

#### E7: Gallery UI
- [ ] `FE-029` `components/photos/PhotoCapture.tsx` — getUserMedia (rear camera), canvas capture, GPS capture, presigned upload flow, no DOM append that triggers gallery save
- [ ] `FE-030` `app/(app)/projects/[id]/gallery/page.tsx` + global gallery page — PhotoGrid with GPS badge
- [ ] `FE-031` `components/photos/PhotoLightbox.tsx` — full image + metadata + map pin

#### E8: Documents UI
- [ ] `FE-032` `components/documents/DocumentUpload.tsx` — presigned upload flow for files
- [ ] `FE-033` Documents tab in project detail — file list (icon, name, size, uploader, date, download)

#### E9: Tools UI
- [ ] `FE-034` `app/(app)/tools/page.tsx` — tool list with status filter
- [ ] `FE-035` `components/tools/ToolForm.tsx` — create/edit

#### E10: Document Acknowledgement UI
- [ ] `FE-036` `app/(app)/documents/page.tsx` — employee view: pending badge in sidebar, list of docs with status
- [ ] `FE-037` `components/doc-acknowledgement/DocAckButton.tsx` — "Olen lugenud ja nõustun" confirmation button with inline document viewer/link
- [ ] `FE-038` `components/doc-acknowledgement/ComplianceMatrix.tsx` — admin view: employee × document acknowledgement grid, Excel export

#### E11: Settings UI
- [ ] `FE-039` `app/(app)/settings/profile/page.tsx` — name, photo, phone, email, language toggle, time format
- [ ] `FE-040` `app/(app)/settings/company/page.tsx`
- [ ] `FE-041` `app/(app)/settings/tags/page.tsx` — tag CRUD
- [ ] `FE-042` `app/(app)/settings/roles/page.tsx` — role CRUD
- [ ] `FE-043` `app/(app)/settings/templates/page.tsx` — task template CRUD

#### E12: PWA + i18n
- [ ] `FE-044` `next-pwa` setup — service worker, manifest.json, LUMICO icons
- [ ] `FE-045` `lib/i18n/et.ts` + `lib/i18n/ru.ts` — all UI strings (nav, status labels, form labels, errors)
- [ ] `FE-046` `hooks/use-translation.ts` — reads from Zustand auth store language field
- [ ] `FE-047` Language toggle in profile → `PATCH /employees/me` → Zustand update → immediate re-render
- [ ] `FE-048` Push notification permission request + VAPID subscription

---

### 6.3 Shared Types (packages/shared-types)

All written by Claude Code. Consumed by Codex. Plain TypeScript — no decorators, no React.

- [ ] `ST-001` Init package: `tsconfig.json`, `package.json`, build script
- [ ] `ST-002` `project.types.ts` — `Project`, `CreateProjectDto`, `UpdateProjectDto`, `ProjectStatus` enum, `ClientSubObject`
- [ ] `ST-003` `task.types.ts` — `Task`, `TaskTemplate`, `TaskStatus` enum, `TaskPriority` enum
- [ ] `ST-004` `time-entry.types.ts` — `TimeEntry`, `TimePause`, `StartTimerDto`, `TimesheetRow`, `TimesheetResponse`
- [ ] `ST-005` `employee.types.ts` — `Employee`, `EmployeeRole`, `EmployeeGroup` enum, `EmployeeStatus` enum
- [ ] `ST-006` `photo.types.ts` — `Photo`, `PhotoUploadUrlResponse`
- [ ] `ST-007` `document.types.ts` — `Document`, `DocumentUploadUrlResponse`
- [ ] `ST-008` `tool.types.ts` — `Tool`, `ToolStatus` enum
- [ ] `ST-009` `doc-acknowledgement.types.ts` — `InternalDocument`, `DocAckAssignment`, `DocAcknowledgement`, `DocAckStatus`
- [ ] `ST-010` `api-responses.types.ts` — `PaginatedResponse<T>`, `ApiError`
- [ ] `ST-011` `settings.types.ts` — `Tag`, `Role`, `CompanySettings`, `TaskTemplate`
- [ ] `ST-012` `websocket.types.ts` — all Socket.io event payloads (timer:started, timer:stopped, timer:paused, timer:resumed)
- [ ] `ST-013` Export all from `index.ts`

---

### 6.4 Infrastructure

- [ ] `INF-001` Root `docker-compose.yml` (dev) — postgres, redis, minio, api, web with hot reload volumes
- [ ] `INF-002` `docker-compose.prod.yml` — nginx, pgbouncer, api, web (no volume mounts)
- [ ] `INF-003` `Dockerfile` for `apps/api` — multi-stage build (builder + runner)
- [ ] `INF-004` `Dockerfile` for `apps/web` — multi-stage Next.js build
- [ ] `INF-005` Nginx config: SSL termination, `/api/*` → api:3001, `/*` → web:3000, `/socket.io/*` WebSocket upgrade
- [ ] `INF-006` `.github/workflows/ci.yml` — runs on every PR to develop/main
- [ ] `INF-007` `.github/workflows/deploy.yml` — builds, pushes GHCR, SSH deploys on merge to main
- [ ] `INF-008` `scripts/backup.sh` — pg_dump → S3 lumico-backups

---

### 6.5 Testing

- [ ] `TEST-001` Unit: `auth.service.spec.ts` — OTP expiry, wrong OTP, rate limit; **dual-mode refresh**: (a) valid cookie → new tokens; (b) valid body `refresh_token` → new tokens; (c) neither → 401; (d) old token after rotation → 401 (replay blocked)
- [ ] `TEST-002` Unit: `time-tracking.service.spec.ts` — BR-001, BR-002, duration with pauses, duration never from body
- [ ] `TEST-003` Unit: `projects.service.spec.ts` — prefix logic (BR-004), soft delete
- [ ] `TEST-004` Unit: `employees.service.spec.ts` — BR-007 invite trigger, BR-013 sensitive field
- [ ] `TEST-005` Unit: `timesheet.service.spec.ts` — month boundary, Tallinn TZ conversion, negative ÜT
- [ ] `TEST-006` E2E: `auth.e2e-spec.ts` — full OTP flow against test DB
- [ ] `TEST-007` E2E: `time-tracking.e2e-spec.ts` — start timer, pause, stop; verify duration; verify BR-001 blocks start without project
- [ ] `TEST-008` Frontend unit: `TimerStartModal.test.tsx` — Start button disabled states, "no project" toggle behavior
- [ ] `TEST-009` Frontend unit: `Tunnitabel.test.tsx` — negative ÜT renders red, correct totals

---

## 7. Dependency Map

```
E0 (Infra)
  └── E1 (DB Schema + Shared Types)
        ├── E2 (Auth)               ← BLOCKS everything
        │     ├── E3 (Projects)
        │     │     ├── E4 (Tasks)
        │     │     │     └── E5 (Time Tracking) ← CRITICAL PATH
        │     │     ├── E7 (Photos/Gallery)
        │     │     └── E8 (Documents)
        │     ├── E6 (Employees/Team)
        │     │     ├── E5 (Time Tracking) — also depends on E6
        │     │     └── E10 (Doc Acknowledgement) — depends on E2 + E6
        │     ├── E9 (Tools)
        │     └── E11 (Settings)
        └── E13 (CI/CD)  ← can start with E0, matures over time

E12 (PWA + i18n) — depends on E2 frontend shell; runs in parallel with E3–E11
```

**Critical path:** E0 → E1 → E2 → E5 (Time Tracking)
Time tracking is the #1 business requirement. Everything else can ship after it.

---

## 8. Recommended Implementation Order

```
Week 1:
  Mon–Tue: BE-001..BE-010 (monorepo + prisma schema + seed)
           ST-001..ST-013 (all shared types)
  Wed–Thu: BE-011..BE-022 (auth backend complete)
           FE-001..FE-008 (frontend shell + login)
  Fri:     INF-001..INF-004 (Docker setup), INF-006 (CI skeleton)

Week 2:
  Mon–Wed: BE-023..BE-037 (projects + tasks backend)
           FE-009..FE-017 (projects + tasks UI)
  Thu–Fri: Begin E5 — BE-038..BE-047 (time tracking backend)

Week 3:
  Mon–Wed: Complete E5 — FE-018..FE-023 (time tracking UI)
           TEST-001..TEST-007 (critical business rule tests)
  Thu–Fri: BE-049..BE-056 (employees backend)
           FE-024..FE-028 (team UI)

Week 4:
  Mon–Tue: BE-057..BE-066 (photos + documents backend)
           FE-029..FE-033 (gallery + documents UI)
  Wed–Thu: BE-067..BE-082 (tools + doc-ack + settings backend)
           FE-034..FE-043 (tools + doc-ack + settings UI)
  Fri:     FE-044..FE-048 (PWA + i18n)

Week 5:
  Mon–Wed: TEST-008..TEST-009 + full e2e pass
           INF-005..INF-008 (production infra)
  Thu–Fri: Deploy to VPS, smoke test, go/no-go
```

---

## 9. Parallel Work Split

### Claude Code responsibilities

| Area | Tasks |
|---|---|
| Monorepo + Docker | BE-001..BE-005, INF-001..INF-008 |
| Database schema + seed | BE-006..BE-010 |
| **All shared-types** | ST-001..ST-013 |
| Auth backend | BE-011..BE-022 |
| Projects/Tasks backend | BE-023..BE-037 |
| **Time Tracking backend** | BE-038..BE-048 |
| Employees backend | BE-049..BE-056 |
| Photos + Documents backend | BE-057..BE-066 |
| Tools + Doc Acknowledgement + Settings backend | BE-067..BE-082 |
| CI/CD pipelines | BE-083..BE-086 |
| Backend unit + e2e tests | TEST-001..TEST-007 |

**Claude Code never touches `apps/web/`.**

### Codex responsibilities

| Area | Tasks |
|---|---|
| Next.js setup + shell | FE-001..FE-008 |
| Projects + Tasks UI | FE-009..FE-017 |
| **Timer UI** (TimerStartModal, TimerWidget) | FE-018..FE-023 |
| Team + Employees UI | FE-024..FE-028 |
| Gallery + Documents UI | FE-029..FE-033 |
| Tools + Doc Acknowledgement + Settings UI | FE-034..FE-043 |
| PWA + i18n | FE-044..FE-048 |
| Frontend tests | TEST-008..TEST-009 |

**Codex never touches `apps/api/` or `packages/shared-types/`.**

### Parallel windows (where both work simultaneously)

```
Window A (Week 1 Thu–Fri):
  Claude Code: auth backend (BE-011..BE-022)
  Codex: frontend shell + login UI (FE-001..FE-008)
  Prerequisite: ST-001..ST-013 done ✓

Window B (Week 2):
  Claude Code: projects + tasks backend
  Codex: projects + tasks UI (consuming shared-types)

Window C (Week 3):
  Claude Code: time tracking backend + tests
  Codex: time tracking UI (TimerStartModal is highest priority)

Window D (Week 4):
  Claude Code: photos/docs/tools/doc-ack/settings backend
  Codex: all remaining UI modules
```

---

## 10. Definition of Done per Milestone

### M0 — Foundation
- [ ] `pnpm install` from root succeeds
- [ ] `docker-compose up -d` starts all 5 services without errors
- [ ] `pnpm --filter api prisma migrate dev` applies initial migration
- [ ] `pnpm --filter api prisma db seed` seeds templates and admin user (idempotent)
- [ ] `pnpm --filter shared-types build` produces type-safe output
- [ ] CI runs on push (even if only typecheck)

### M1 — Auth + Shell
- [ ] Employee can log in via OTP (phone) and receive JWT
- [ ] Employee can log in via email+password
- [ ] `POST /auth/refresh` accepts token from httpOnly cookie (web path)
- [ ] `POST /auth/refresh` accepts token from request body `{ refresh_token }` (native path)
- [ ] Both paths return `{ access_token, refresh_token }` in body AND set httpOnly cookie
- [ ] Replaying a used refresh token returns 401 (rotation enforcement)
- [ ] AppShell renders with sidebar navigation
- [ ] Unauthenticated users are redirected to /login
- [ ] Auth unit tests pass (including all 4 dual-mode cases in TEST-001)

### M2 — Projects + Tasks
- [ ] Admin can create a project with all fields; prefix auto-sets (QUOT/P)
- [ ] Status change auto-updates prefix
- [ ] Admin can create a task from a template
- [ ] Task can be created without a project (valid state)
- [ ] Project + task lists render with correct status badges and colors

### M3 — Time Tracking ⚠️
- [ ] Timer cannot start without project+task OR reason ≥10 chars (BR-001 enforced backend)
- [ ] Zero-duration entries are rejected (BR-002)
- [ ] Duration is computed server-side; sending `duration` in body has no effect
- [ ] Pause/resume works; paused time excluded from duration
- [ ] Tunnitabel renders correct monthly grid in Europe/Tallinn timezone
- [ ] Negative ÜT cells render in `text-red-600 font-semibold`
- [ ] Excel export downloads a valid .xlsx file
- [ ] WebSocket emits timer events; Praegu page updates without refresh
- [ ] All BR-001, BR-002 unit tests pass

### M4 — Team + Employees
- [ ] Admin can create/edit/archive employees
- [ ] Sensitive fields hidden from non-admin
- [ ] Invitation SMS/email triggered on first phone/email save
- [ ] Praegu shows live active timers with elapsed counters

### M5 — Gallery + Documents
- [ ] Photo taken on mobile does NOT appear in device gallery
- [ ] GPS coordinates captured and stored with photo
- [ ] Thumbnail generated server-side
- [ ] Documents upload and download via presigned URLs

### M6 — Tools + Doc Acknowledgement + Settings
- [ ] Tools list with status filter works
- [ ] Admin can upload internal document and assign it to employees/groups
- [ ] Employee sees pending acknowledgements; can acknowledge with confirmation
- [ ] Admin compliance matrix shows acknowledgement status per employee
- [ ] Tags, roles, task templates are manageable in Settings

### M7 — PWA + i18n
- [ ] App installs from browser on Android Chrome
- [ ] All UI strings have both ET and RU translations
- [ ] Language switch in profile re-renders UI immediately
- [ ] App shows cached project/task list when offline

### M8 — Deployment
- [ ] CI pipeline passes on all branches
- [ ] Production deployment runs on merge to main
- [ ] `prisma migrate deploy` runs automatically on deploy
- [ ] HTTPS working on production VPS
- [ ] Admin can log in on production and create a project

---

## 11. Immediate Next 10 Tasks

These are the first tasks to execute, in order:

| # | Task ID | Description | Owner | Blocks |
|---|---|---|---|---|
| 1 | `BE-001` | Init monorepo: pnpm-workspace.yaml, root tsconfig, .prettierrc, .eslintrc | Claude Code | Everything |
| 2 | `BE-002` | Create `apps/api` NestJS project with strict TypeScript | Claude Code | All backend |
| 3 | `FE-web-init` | Create `apps/web` Next.js 14 project with Tailwind + strict TypeScript | Codex | All frontend |
| 4 | `ST-001` | Init `packages/shared-types` with build script | Claude Code | All shared types |
| 5 | `INF-001` | `docker-compose.yml` with postgres:15, redis:7, minio services | Claude Code | Local dev |
| 6 | `BE-006` | Write full `prisma/schema.prisma` based on ARCHITECTURE.md §4 | Claude Code | All DB work |
| 7 | `BE-007` | Run initial migration `20260405_initial_schema` | Claude Code | Seed, auth |
| 8 | `ST-002..013` | Write all shared-types (all interfaces + enums) | Claude Code | All frontend API calls |
| 9 | `BE-009` | `prisma/seed.ts` — 19 templates, admin user, roles, groups | Claude Code | Dev environment |
| 10 | `BE-011..014` | Auth module scaffold + JwtStrategy + RolesGuard + ProjectAccessGuard | Claude Code | All protected routes |

**Assumption (stated):** Codex begins frontend setup (task 3) in parallel with Claude Code's monorepo setup (task 1), but cannot build any feature UI until shared-types (task 8) are published. Codex can build the login page and AppShell shell in the meantime.

---

*Document maintained by LUMICO development team. Last updated: 2026-04-05.*
*Always read alongside: CLAUDE.md, docs/PRD.md, docs/TECH_STACK.md, docs/ARCHITECTURE.md*
