# CLAUDE.md — AI Development Guidelines
**Project:** LUMICO Field & Production Management Platform
**For:** Claude Code (backend) + Codex (frontend)
**Last updated:** 2026-04-05

---

## Overview

This file is the primary reference for AI agents working on this codebase. Read it entirely before writing any code. It defines the repository structure, coding conventions, workflow rules, and coordination protocol between Claude Code (backend) and Codex (frontend).

---

## Repository Structure

```
/
├── apps/
│   ├── api/                   # NestJS backend (Claude Code owns this)
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── time-tracking/
│   │   │   ├── employees/
│   │   │   ├── photos/
│   │   │   ├── tools/
│   │   │   ├── doc-acknowledgement/
│   │   │   ├── settings/
│   │   │   ├── common/        # shared guards, decorators, pipes, interceptors
│   │   │   ├── database/      # Prisma schema, migrations, seeds
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── test/
│   │   └── package.json
│   │
│   └── web/                   # Next.js 16 frontend (Codex owns this)
│       ├── app/               # App Router
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── public/
│       └── package.json
│
├── packages/
│   └── shared-types/          # Shared TypeScript interfaces used by both apps
│       └── src/
│
├── docs/
│   ├── PRD.md
│   ├── TECH_STACK.md
│   └── ARCHITECTURE.md
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
└── CLAUDE.md                  # this file
```

---

## Agent Ownership

| Area | Owner | Notes |
|---|---|---|
| `apps/api/` — entire NestJS backend | Claude Code | All API endpoints, DB schema, business logic |
| `apps/web/` — entire Next.js frontend | Codex | All UI components, pages, hooks, client state |
| `packages/shared-types/` | Both | Claude Code defines types; Codex consumes them. PRs from either. |
| `docs/` | Both | Either agent can update documentation |
| `docker-compose.yml` | Claude Code | Infrastructure files |
| `.github/workflows/` | Claude Code | CI/CD pipelines |

### Cross-agent Protocol

When Claude Code changes an API contract (adds/removes fields, changes endpoint path or method):
1. Update `packages/shared-types/src/` first.
2. Add a comment in the PR description: `API CHANGE: [describe what changed]`.
3. Codex must update its API calls before the PR can merge.

When Codex needs a new API endpoint or field:
1. Open a GitHub issue labeled `backend-request` describing the requirement.
2. Claude Code implements it and updates shared-types.
3. Codex consumes it after the backend PR is merged.

---

## Backend — Claude Code Guidelines (apps/api)

### Framework & Patterns

- **NestJS** with the module/controller/service/repository pattern.
- One module per domain: `ProjectsModule`, `TasksModule`, `TimeTrackingModule`, `EmployeesModule`, etc.
- Controllers handle HTTP routing and input validation only. No business logic in controllers.
- Services contain all business logic. Services are injectable and testable.
- Repositories (via Prisma client) handle all database access. Never write raw SQL in services.

### Naming Conventions

```
// Files
projects.module.ts
projects.controller.ts
projects.service.ts
create-project.dto.ts
update-project.dto.ts
project.entity.ts        // Prisma result type wrapper if needed

// Classes
class ProjectsController {}
class ProjectsService {}
class CreateProjectDto {}

// Database (Prisma schema)
model Project { ... }    // PascalCase model names
project_id               // snake_case column names
created_at, updated_at   // always present on every model
```

### API Design

- REST API. Base path: `/api/v1/`.
- Use HTTP verbs correctly: GET (read), POST (create), PATCH (partial update), PUT (full replace), DELETE.
- Response envelope for lists:
  ```json
  {
    "data": [...],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 20
    }
  }
  ```
- Single-item responses return the object directly (no wrapper).
- Error responses:
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Timer cannot start without project selection or a stated reason"
  }
  ```
- Always use NestJS `ValidationPipe` globally. All DTOs use `class-validator` decorators.

### Key Endpoints Reference

```
# Auth
POST   /api/v1/auth/otp/request       # Request OTP via phone
POST   /api/v1/auth/otp/verify        # Verify OTP → { access_token, refresh_token } + Set-Cookie: refresh_token
POST   /api/v1/auth/login             # Email+password → { access_token, refresh_token } + Set-Cookie: refresh_token
POST   /api/v1/auth/refresh           # Dual-mode: cookie (web) OR body { refresh_token } (native) → { access_token, refresh_token } + Set-Cookie: refresh_token
POST   /api/v1/auth/logout            # Invalidate refresh token (clears cookie + DB record)

# Projects
GET    /api/v1/projects               # List (filterable, paginated)
POST   /api/v1/projects               # Create
GET    /api/v1/projects/:id           # Get by ID
PATCH  /api/v1/projects/:id           # Update
DELETE /api/v1/projects/:id           # Soft delete

# Tasks
GET    /api/v1/tasks                  # List
POST   /api/v1/tasks                  # Create
GET    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
GET    /api/v1/tasks/templates        # All task templates

# Time Tracking
GET    /api/v1/time-entries           # List (filter by employee, project, date)
POST   /api/v1/time-entries           # Create (timer start or manual entry)
GET    /api/v1/time-entries/:id
PATCH  /api/v1/time-entries/:id
POST   /api/v1/time-entries/:id/pause
POST   /api/v1/time-entries/:id/resume
POST   /api/v1/time-entries/:id/stop
GET    /api/v1/time-entries/timesheet # Monthly timesheet data
GET    /api/v1/time-entries/timesheet/export # Excel download

# Employees
GET    /api/v1/employees
POST   /api/v1/employees
GET    /api/v1/employees/:id
PATCH  /api/v1/employees/:id
PATCH  /api/v1/employees/me           # Update own profile (language, name, etc.)
POST   /api/v1/employees/:id/archive

# Photos (two-step presigned upload)
POST   /api/v1/photos/upload-url      # Step 1: get presigned S3 PUT URL
POST   /api/v1/photos                 # Step 2: save metadata after direct S3 upload
GET    /api/v1/photos                 # List with filters

# Documents
POST   /api/v1/documents/upload-url   # Step 1: get presigned S3 PUT URL
POST   /api/v1/documents              # Step 2: save metadata after direct S3 upload
GET    /api/v1/documents              # List (filter by project_id)
DELETE /api/v1/documents/:id          # Hard delete (not a business entity)

# Tools
GET    /api/v1/tools
POST   /api/v1/tools
GET    /api/v1/tools/:id
PATCH  /api/v1/tools/:id

# Internal Documents & Acknowledgements
POST   /api/v1/internal-documents/upload-url      # Presigned S3 PUT URL
POST   /api/v1/internal-documents                 # Save metadata (title, category, s3_key)
GET    /api/v1/internal-documents                 # Admin: list all documents
PATCH  /api/v1/internal-documents/:id             # Admin: update (new file = version bump)
DELETE /api/v1/internal-documents/:id             # Admin: soft archive
POST   /api/v1/internal-documents/:id/assign      # Admin: assign to employees/groups
GET    /api/v1/internal-documents/:id/status      # Admin: compliance matrix
GET    /api/v1/internal-documents/my              # Employee: my pending + acknowledged docs
POST   /api/v1/internal-documents/:id/acknowledge # Employee: confirm acknowledgement

# Settings
GET    /api/v1/settings/tags
POST   /api/v1/settings/tags
PATCH  /api/v1/settings/tags/:id
DELETE /api/v1/settings/tags/:id
GET    /api/v1/settings/roles
# ... similar CRUD for roles, groups
```

### Database — Prisma Rules

- **Never edit migration files** once applied. Always create a new migration.
- Migration naming: `YYYYMMDD_descriptive_name` (e.g., `20260405_add_gps_to_photos`).
- Every model must have `created_at DateTime @default(now())` and `updated_at DateTime @updatedAt`.
- Soft deletes: use `archived_at DateTime?` rather than hard deletes for business entities (Projects, Employees, Tasks, Tools). Hard delete only for join table records.
- Never use Prisma `$queryRaw` unless absolutely necessary. Use typed Prisma client methods.
- Seed file: `prisma/seed.ts`. Must be idempotent (safe to run multiple times). Seeds task templates and initial admin user.

### Business Logic — Critical Rules

These rules must be enforced at the SERVICE layer (not just in DTOs):

**Time Tracking:**
```typescript
// BR-001: No project without reason
if (!dto.project_id && (!dto.no_project_reason || dto.no_project_reason.length < 10)) {
  throw new BadRequestException('Timer requires project+task or a reason (min 10 chars)');
}

// BR-002: Zero duration blocked
if (dto.ended_at && dto.started_at >= dto.ended_at) {
  throw new BadRequestException('Entry duration cannot be zero');
}

// BR-003: Duration computed, never accepted
// Remove duration from any incoming DTO — always compute server-side
computedDuration = differenceInSeconds(entry.ended_at, entry.started_at)
                  - sumPauseDurations(entry.pauses);
```

**Projects:**
```typescript
// BR-004: Prefix derived from status
function getProjectPrefix(status: ProjectStatus): 'QUOT' | 'P' {
  return status === ProjectStatus.Hinnapakkumises ? 'QUOT' : 'P';
}
```

**Document Acknowledgement:**
```typescript
// BR-016: Employee can only acknowledge if assigned (direct or via group)
const isAssigned = await this.checkAssignment(employeeId, documentId, employee.group);
if (!isAssigned) throw new ForbiddenException('Document not assigned to this employee');

// BR-017: New file upload increments version, invalidates prior acks
if (dto.s3_key && dto.s3_key !== document.s3_key) {
  newVersion = document.version + 1;
  // Existing DocAcknowledgement rows remain (audit trail) but status computed by version mismatch
}

// BR-018: Acknowledgements are immutable — no DELETE, no PATCH
// DocAcknowledgement has no update/delete service methods
```

**Employees:**
```typescript
// BR-007: Invitation on first phone/email
if (!existingEmployee.phone && dto.phone) {
  await this.invitationService.sendSmsInvitation(dto.phone, employee.id);
}
if (!existingEmployee.email && dto.email) {
  await this.invitationService.sendEmailInvitation(dto.email, employee.id);
}

// BR-013: Sensitive field authorization
if (!requestingUser.roles.includes('Administraator')) {
  delete employee.hourly_rate;
  delete employee.personal_id;
  delete employee.birth_date;
}
```

### Auth — Dual-Mode Refresh Token

**Every auth response** (OTP verify, login, refresh) must set the cookie AND return the token in the body:
```typescript
// Shared helper — call this instead of manually setting cookie + body each time
private issueTokenResponse(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return { access_token: accessToken, refresh_token: refreshToken };
}
```

**`RefreshTokenDto`** (used by `POST /auth/refresh`):
```typescript
// refresh-token.dto.ts
import { IsOptional, IsString } from 'class-validator';
export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refresh_token?: string;  // undefined = web client (uses cookie); present = native client
}
```

**`POST /auth/refresh` controller method:**
```typescript
@Post('refresh')
@HttpCode(200)
async refresh(
  @Req() req: Request,
  @Body() body: RefreshTokenDto,
  @Res({ passthrough: true }) res: Response,
) {
  const incomingToken = req.cookies?.refresh_token ?? body.refresh_token;
  if (!incomingToken) throw new UnauthorizedException('No refresh token provided');
  const { accessToken, refreshToken } = await this.authService.refreshTokens(incomingToken);
  return this.issueTokenResponse(res, accessToken, refreshToken);
}
```

### Authorization

- Use `@UseGuards(JwtAuthGuard, RolesGuard)` on all protected routes.
- `@Roles('Administraator')` decorator for admin-only endpoints.
- Employee can always access their own data (own time entries, own profile).
- Project access check: if employee's `project_access !== 'ALL'`, verify requested project ID is in their list.

### WebSocket (Socket.io)

- Gateway: `TimeTrackingGateway` in `time-tracking/` module.
- Events emitted by server:
  - `timer:started` — payload: `{ employee_id, project_id, project_name, task_id, task_name, started_at }`
  - `timer:stopped` — payload: `{ employee_id, time_entry_id }`
  - `timer:paused` — payload: `{ employee_id, time_entry_id }`
  - `timer:resumed` — payload: `{ employee_id, time_entry_id }`
- No additional WebSocket events beyond timer events in Phase 1. Chat WebSocket events are Phase 2.
- Authentication: WebSocket connection requires JWT in handshake `auth.token` field.

### Timezone Handling

```typescript
// Store: always UTC in DB (Prisma/PostgreSQL handles this with @db.Timestamptz)
// Never store with offset — use timestamptz columns

// Display: convert in the API response only if the frontend requests it,
// OR let the frontend handle conversion using the TZ info in the JWT payload.
// Default display timezone: 'Europe/Tallinn'

// In timesheet calculations, use date-fns-tz:
import { toZonedTime, format } from 'date-fns-tz';
const tallinDate = toZonedTime(utcDate, 'Europe/Tallinn');
```

### Environment Variables

Required in `apps/api/.env`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/lumico
JWT_SECRET=...          # HS256 symmetric secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=...
REFRESH_TOKEN_EXPIRES_IN=7d
AWS_S3_BUCKET=lumico-files
AWS_S3_REGION=eu-north-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SMTP_HOST=...           # for email invitations
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMS_PROVIDER_API_KEY=... # for phone OTP and SMS invitations
SOCKET_CORS_ORIGIN=http://localhost:3000
```

### Testing

- Unit tests: every service must have a corresponding `.spec.ts` file.
- Use Jest. Mock Prisma client with `jest-mock-extended`.
- E2E tests: `apps/api/test/` directory. Use `@nestjs/testing` TestingModule.
- Run tests: `pnpm test` (unit) and `pnpm test:e2e` (e2e).
- Minimum coverage target: 80% on service files.
- Critical business rules (BR-001 to BR-015) must have explicit unit tests.

---

## Frontend — Codex Guidelines (apps/web)

### Framework & Patterns

- **Next.js 16** with the App Router.
- Server Components by default. Use `'use client'` only when needed (event handlers, browser APIs, hooks).
- State management: React Query (TanStack Query) for server state. Zustand for minimal global client state (auth, current user, active timer).
- Styling: Tailwind CSS. No CSS modules or styled-components.

### Component Structure

```
components/
├── ui/                  # Primitive components (Button, Input, Modal, Badge, Avatar...)
├── layout/              # AppShell, Sidebar, Header, PageContainer
├── projects/            # ProjectCard, ProjectForm, ProjectStatusBadge...
├── tasks/               # TaskCard, TaskForm, TaskKanban...
├── time-tracking/       # TimerWidget, TimeEntryRow, TimesheetGrid...
├── team/                # EmployeeCard, PraeguBoard, TimesheetExport...
├── photos/              # PhotoGrid, PhotoCapture, PhotoLightbox...
├── doc-acknowledgement/ # DocList, DocAckButton, ComplianceMatrix...
└── tools/               # ToolCard, ToolForm...
```

### Key UI Rules

**Timer Start Modal** — this is the most critical UI component:
- Opens immediately when "Start Timer" is tapped.
- Shows project selector (searchable) and task selector (cascading from project).
- Shows "No project" toggle. When toggled on: hides project/task selectors, shows required textarea (min 10 chars).
- "Start" button disabled until requirements met.
- Should feel fast — pre-load employee's recent projects on page mount.

**Praegu (Live View)**:
- Connects to WebSocket on mount. Disconnects on unmount.
- Show a live elapsed time counter for each active employee (client-side increment, no server polling).
- Use Zustand to hold the list of active timers from WebSocket events.

**Timesheet Grid**:
- Renders a sticky-header table: columns are days, rows are employees.
- Negative ÜT cells: `text-red-600 font-semibold`.
- Export button calls `/api/v1/time-entries/timesheet/export` and triggers browser download.

**Photo Capture (PWA)**:
```typescript
// Use getUserMedia, NOT <input type="file" capture="camera">
// getUserMedia gives us control to prevent gallery saves
const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
// Draw to canvas, get blob, call GPS
// Step 1: POST /api/v1/photos/upload-url → get presigned S3 PUT URL
// Step 2: PUT blob directly to S3 using presigned URL
// Step 3: POST /api/v1/photos with { s3_key, project_id, task_id, gps_lat, gps_lng, taken_at }
// Never append to DOM in a way that triggers save-to-gallery
```

**Language Toggle**:
- Language stored in user profile (API-persisted).
- All UI strings in `lib/i18n/et.ts` and `lib/i18n/ru.ts`.
- Use a simple `useTranslation()` hook backed by the current user's language.
- On language change: PATCH `/api/v1/employees/me` with `{ language: 'et' | 'ru' }`, then `router.refresh()`.

### Tailwind Conventions

- No arbitrary values unless unavoidable (e.g., `w-[342px]` — only if truly needed).
- Use semantic class groups: prefer `text-red-600` over `text-[#dc2626]`.
- Status colors (consistent across all components):
  - Hinnapakkumises: `bg-amber-100 text-amber-800`
  - Ettevalmistuses: `bg-blue-100 text-blue-800`
  - Töös: `bg-green-100 text-green-800`
  - Lõpetatud: `bg-gray-100 text-gray-700`
  - Task Uus: `bg-slate-100 text-slate-700`
  - Task Teha: `bg-yellow-100 text-yellow-800`
  - Task Töös: `bg-blue-100 text-blue-800`
  - Task Tehtud: `bg-green-100 text-green-800`
  - Priority Madal: `bg-gray-100 text-gray-600`
  - Priority Keskmine: `bg-orange-100 text-orange-700`
  - Priority Kõrgeim: `bg-red-100 text-red-700`
  - Tool Töökorras: `bg-green-100 text-green-700`
  - Tool Rikki: `bg-red-100 text-red-700`
  - Tool Hoolduses: `bg-yellow-100 text-yellow-800`

### API Communication

- All API calls via a typed `apiClient` wrapper in `lib/api-client.ts`.
- Use React Query hooks in `hooks/` directory: `useProjects()`, `useTasks()`, `useTimeEntries()`, etc.
- WebSocket client: `lib/socket.ts` — singleton Socket.io client instance.
- Error handling: show toast notifications for API errors. Use a global error boundary for fatal errors.

### Environment Variables

Required in `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## Shared Types (packages/shared-types)

Both apps import from this package. Claude Code writes the types; Codex consumes them.

```typescript
// packages/shared-types/src/index.ts
export * from './project.types';
export * from './task.types';
export * from './time-entry.types';
export * from './employee.types';
export * from './photo.types';
export * from './tool.types';
export * from './doc-acknowledgement.types';
export * from './api-responses.types';
```

Types here must be plain TypeScript interfaces/enums — no NestJS decorators, no React imports.

---

## Git Workflow

### Branches

```
main            # production-ready code only
develop         # integration branch — merges go here first
feature/xxx     # new features (e.g., feature/time-tracking-modal)
fix/xxx         # bug fixes
```

- Branch from `develop`, PR back to `develop`.
- `main` only updated via release PRs from `develop`.
- Protect `main` and `develop`: require PR review + CI pass.

### Commit Messages

Follow Conventional Commits:
```
feat(time-tracking): enforce project selection before timer start
fix(employees): exclude archived employees from assignee picker
refactor(projects): extract prefix computation to utility function
docs(api): add timesheet endpoint to CLAUDE.md
test(time-tracking): add unit tests for zero-duration validation
```

Scopes: `auth`, `projects`, `tasks`, `time-tracking`, `employees`, `photos`, `tools`, `doc-ack`, `settings`, `infra`, `api`, `web`.

### PR Rules

- PR title must follow Conventional Commits format.
- PRs must include a description of what changed and why.
- If an API contract changed, include `API CHANGE:` section.
- All CI checks must pass before merge.
- At least one review required (from the other agent or a human).

---

## CI/CD

File: `.github/workflows/ci.yml`

```yaml
# Runs on every PR to develop and main:
jobs:
  api-tests:
    - pnpm install
    - pnpm --filter api prisma generate
    - pnpm --filter api test
    - pnpm --filter api test:e2e

  web-build:
    - pnpm install
    - pnpm --filter web build
    - pnpm --filter web lint

  typecheck:
    - pnpm --filter shared-types build
    - pnpm --filter api typecheck
    - pnpm --filter web typecheck
```

---

## Local Development Setup

```bash
# Prerequisites: Node 20+, pnpm, Docker

# 1. Start infrastructure
docker-compose up -d  # starts PostgreSQL, Redis, MinIO

# 2. Install dependencies
pnpm install

# 3. Run DB migrations and seed
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed

# 4. Start API (dev with hot reload)
pnpm --filter api dev   # runs on :3001

# 5. Start web (dev with hot reload)
pnpm --filter web dev   # runs on :3000
```

---

## Common Mistakes to Avoid

1. **Do not put business logic in controllers.** Controllers validate input and call services. Services own logic.
2. **Do not accept `duration` in time entry API requests.** Duration is always computed server-side.
3. **Do not use `new Date()` for "current time" in services.** Use dependency-injected `DateService` or pass timestamp from the request body — makes tests deterministic.
4. **Do not return sensitive employee fields without role check.** `hourly_rate`, `personal_id`, `birth_date` are Administraator-only.
5. **Do not use `<input type="file" capture>` for photo capture on mobile.** Use `getUserMedia` to prevent gallery saves.
6. **Do not hard-delete business entities.** Use `archived_at` soft delete.
7. **Do not store timestamps with timezone offset in DB.** Store UTC via `timestamptz`. Convert for display only.
8. **Do not mix ET and RU strings in a single string constant.** All strings must be in both translation files.
9. **Do not allow timer start without project validation check on the backend.** The frontend validation is UX; the backend validation is the source of truth.
10. **Do not send full employee objects in list responses if the requester is not an admin.** Strip sensitive fields in the serializer.
11. **Do not implement data mutations as Next.js Server Actions or Next.js API routes.** All mutations must go through `POST/PATCH/DELETE /api/v1/*` NestJS endpoints. Server Actions are web-only and cannot be called by future native iOS/Android apps.

---

## Reference Documents

- Full PRD (Phase 1): `docs/PRD.md`
- Tech stack decisions and rationale: `docs/TECH_STACK.md`
- System architecture and data flow: `docs/ARCHITECTURE.md`
- Prisma schema: `apps/api/prisma/schema.prisma`
- API base URL: `http://localhost:3001/api/v1` (development)
