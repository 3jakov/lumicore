# System Architecture — LUMICO Field & Production Management Platform
**Version:** 1.0
**Date:** 2026-04-05

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Component Overview](#2-component-overview)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Database Schema](#4-database-schema)
5. [API Layer Design](#5-api-layer-design)
6. [Real-time Architecture](#6-real-time-architecture)
7. [File Storage Architecture](#7-file-storage-architecture)
8. [Authentication & Authorization Flow](#8-authentication--authorization-flow)
9. [Module Dependency Map](#9-module-dependency-map)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Security Architecture](#11-security-architecture)
12. [Error Handling Strategy](#12-error-handling-strategy)

---

## 1. High-Level Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                            CLIENTS                                          ║
║                                                                              ║
║  ┌─────────────────────┐   ┌──────────────────────┐                        ║
║  │   Browser (Desktop) │   │  PWA (Mobile/Field)  │                        ║
║  │   Next.js 16        │   │  Service Worker      │                        ║
║  │   Chrome/Firefox    │   │  Camera + GPS        │                        ║
║  └──────────┬──────────┘   └──────────┬───────────┘                        ║
╚═════════════╪═════════════════════════╪════════════════════════════════════╝
              │ HTTPS :443              │ HTTPS :443
              ▼                         ▼
╔══════════════════════════════════════════════════════════════════════════════╗
║                         NGINX REVERSE PROXY                                 ║
║  - SSL termination (Let's Encrypt)                                          ║
║  - HTTP → HTTPS redirect                                                    ║
║  - /api/* → api:3001                                                       ║
║  - /* → web:3000                                                            ║
║  - WebSocket upgrade: /socket.io/* → api:3001                              ║
╚══════════════════╤═══════════════════════════════════════════════════════════╝
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐   ┌────────────────────┐
│  Next.js :3000│   │   NestJS API :3001  │
│  (web app)    │   │   REST + WebSocket  │
│               │   │                    │
│  Server Side  │   │  ┌──────────────┐  │
│  Components   │   │  │  Controllers │  │
│  Client Side  │   │  │  Services    │  │
│  Components   │   │  │  Gateways    │  │
│  Service      │   │  │  Guards      │  │
│  Worker       │   │  └──────┬───────┘  │
└───────────────┘   └─────────╪──────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
               ▼              ▼              ▼
        ┌────────────┐ ┌────────────┐ ┌──────────┐
        │ PostgreSQL │ │   Redis    │ │    S3    │
        │    :5432   │ │   :6379   │ │ (MinIO)  │
        │  (primary) │ │  OTP/rate │ │  files   │
        │            │ │  limiting │ │  photos  │
        └────────────┘ └────────────┘ └──────────┘
```

---

## 2. Component Overview

### 2.1 Frontend (apps/web)

```
apps/web/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: unauthenticated
│   │   ├── login/page.tsx
│   │   └── layout.tsx            # No nav sidebar
│   │
│   ├── (app)/                    # Route group: authenticated
│   │   ├── layout.tsx            # AppShell: sidebar + header
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx          # Project list
│   │   │   ├── [id]/page.tsx     # Project detail (tabs)
│   │   │   └── new/page.tsx
│   │   ├── tasks/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── time/
│   │   │   ├── page.tsx          # My time entries
│   │   │   └── timesheet/page.tsx
│   │   ├── team/
│   │   │   ├── praegu/page.tsx   # Live view
│   │   │   ├── timesheet/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── people/
│   │   │       ├── page.tsx
│   │   │       └── [id]/page.tsx
│   │   ├── tools/page.tsx
│   │   ├── documents/
│   │   │   └── page.tsx               # My required documents + ack status
│   │   └── settings/
│   │       ├── profile/page.tsx
│   │       ├── company/page.tsx
│   │       ├── tags/page.tsx
│   │       ├── roles/page.tsx
│   │       └── templates/page.tsx
│   │
│   ├── api/                      # Next.js API routes (minimal, mostly proxies)
│   └── layout.tsx                # Root layout, font loading
│
├── components/
│   ├── ui/                       # Design system primitives
│   ├── layout/                   # AppShell, Sidebar, Header
│   ├── timer/                    # TimerWidget, TimerStartModal (CRITICAL)
│   ├── projects/
│   ├── tasks/
│   ├── time-tracking/
│   ├── team/
│   ├── photos/                   # PhotoCapture (getUserMedia), PhotoGrid
│   ├── doc-acknowledgement/  # DocList, DocAckButton, ComplianceMatrix
│   └── tools/
│
├── hooks/                        # React Query hooks
│   ├── use-projects.ts
│   ├── use-tasks.ts
│   ├── use-time-entries.ts
│   ├── use-employees.ts
│   ├── use-timer.ts              # Active timer state + WebSocket sync
│   └── use-socket.ts            # WebSocket connection management
│
├── lib/
│   ├── api-client.ts             # Typed fetch wrapper
│   ├── socket.ts                 # Socket.io singleton
│   ├── i18n/
│   │   ├── et.ts
│   │   └── ru.ts
│   └── utils/
│       ├── date.ts               # date-fns-tz helpers
│       └── format.ts             # currency, duration formatters
│
└── store/                        # Zustand stores
    ├── auth.store.ts             # currentUser, tokens
    ├── timer.store.ts            # active timer state
    └── socket.store.ts          # connection state, active timers map
```

### 2.2 Backend (apps/api)

```
apps/api/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── dto/
│       ├── login.dto.ts
│       └── otp-verify.dto.ts
│
├── projects/
│   ├── projects.module.ts
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── dto/
│       ├── create-project.dto.ts
│       └── update-project.dto.ts
│
├── tasks/
│   ├── tasks.module.ts
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── dto/
│
├── time-tracking/
│   ├── time-tracking.module.ts
│   ├── time-tracking.controller.ts
│   ├── time-tracking.service.ts
│   ├── timesheet.service.ts      # Monthly grid computation
│   ├── time-tracking.gateway.ts  # WebSocket gateway
│   └── dto/
│       ├── start-timer.dto.ts
│       ├── stop-timer.dto.ts
│       └── timesheet-query.dto.ts
│
├── employees/
│   ├── employees.module.ts
│   ├── employees.controller.ts
│   ├── employees.service.ts
│   ├── invitation.service.ts     # SMS/email invitations
│   └── dto/
│
├── photos/
│   ├── photos.module.ts
│   ├── photos.controller.ts
│   ├── photos.service.ts
│   └── dto/
│
├── tools/
│   ├── tools.module.ts
│   ├── tools.controller.ts
│   ├── tools.service.ts
│   └── dto/
│
├── doc-acknowledgement/
│   ├── doc-acknowledgement.module.ts
│   ├── doc-acknowledgement.controller.ts
│   ├── doc-acknowledgement.service.ts
│   └── dto/
│       ├── create-internal-document.dto.ts
│       ├── assign-document.dto.ts
│       └── acknowledge-document.dto.ts
│
├── settings/
│   ├── settings.module.ts
│   ├── settings.controller.ts    # Tags, roles, groups, company
│   └── settings.service.ts
│
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts    # @Roles('Administraator')
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   └── project-access.guard.ts
│   ├── interceptors/
│   │   └── sensitive-fields.interceptor.ts  # strips hourly_rate etc for non-admin
│   ├── pipes/
│   │   └── parse-pagination.pipe.ts
│   └── types/
│       └── jwt-payload.type.ts
│
├── database/
│   └── database.module.ts        # Prisma module (global)
│
└── main.ts                       # Bootstrap: ValidationPipe, CORS, Swagger
```

---

## 3. Data Flow Diagrams

### 3.1 Timer Start Flow (Critical Path)

```
Employee (PWA)          API Server              PostgreSQL       Redis        WebSocket
      │                      │                      │              │              │
      │ Tap "Start Timer"    │                      │              │              │
      │─────────────────────▶│                      │              │              │
      │                      │                      │              │              │
      │◀── TimerStartModal ──│                      │              │              │
      │    (requires project │                      │              │              │
      │     + task OR reason)│                      │              │              │
      │                      │                      │              │              │
      │ Select project/task  │                      │              │              │
      │ POST /time-entries   │                      │              │              │
      │ { project_id,        │                      │              │              │
      │   task_id,           │                      │              │              │
      │   started_at }       │                      │              │              │
      │─────────────────────▶│                      │              │              │
      │                      │ Validate:            │              │              │
      │                      │ - project_id OR      │              │              │
      │                      │   no_project_reason  │              │              │
      │                      │ - no open timer for  │              │              │
      │                      │   this employee      │              │              │
      │                      │─────────────────────▶│              │              │
      │                      │◀── employee active   │              │              │
      │                      │    timer check ──────│              │              │
      │                      │                      │              │              │
      │                      │ INSERT time_entry    │              │              │
      │                      │ (ended_at = null)    │              │              │
      │                      │─────────────────────▶│              │              │
      │                      │◀──── entry_id ───────│              │              │
      │                      │                      │              │              │
      │                      │ emit 'timer:started' │              │              │
      │                      │──────────────────────────────────────────────────▶│
      │                      │ { employee_id,       │              │              │
      │                      │   project_name,      │              │              │
      │                      │   task_name,         │              │              │
      │                      │   started_at }       │              │              │
      │                      │                      │              │              │
      │◀── 201 Created ──────│                      │              │              │
      │    { time_entry }    │                      │              │              │
      │                      │                      │              │              │
      │ Start local counter  │                      │              │              │
      │ Display: project/task│                      │              │              │
```

### 3.2 Photo Upload Flow

```
Field Worker (PWA)        API Server           S3 / MinIO        PostgreSQL
      │                       │                     │                 │
      │ Open camera           │                     │                 │
      │ getUserMedia()        │                     │                 │
      │ (rear camera)         │                     │                 │
      │                       │                     │                 │
      │ Capture frame         │                     │                 │
      │ → canvas.toBlob()     │                     │                 │
      │                       │                     │                 │
      │ navigator.geolocation │                     │                 │
      │ .getCurrentPosition() │                     │                 │
      │ (capture GPS)         │                     │                 │
      │                       │                     │                 │
      │ POST /photos/upload-url│                     │                 │
      │ { filename, mime_type }│                     │                 │
      │──────────────────────▶│                     │                 │
      │                       │ Generate presigned  │                 │
      │                       │ PUT URL (15 min TTL)│                 │
      │                       │────────────────────▶│                 │
      │                       │◀── presigned URL ───│                 │
      │◀── { upload_url,      │                     │                 │
      │      s3_key } ────────│                     │                 │
      │                       │                     │                 │
      │ PUT {upload_url}      │                     │                 │
      │ (binary photo blob)   │                     │                 │
      │──────────────────────────────────────────▶  │                 │
      │◀──────────────── 200 OK ───────────────── │                  │
      │                       │                     │                 │
      │ POST /photos          │                     │                 │
      │ { s3_key,             │                     │                 │
      │   project_id,         │                     │                 │
      │   task_id,            │                     │                 │
      │   gps_lat, gps_lng,   │                     │                 │
      │   taken_at }          │                     │                 │
      │──────────────────────▶│                     │                 │
      │                       │ Generate thumbnail  │                 │
      │                       │ (sharp)             │                 │
      │                       │────────────────────▶│                 │
      │                       │◀── thumb stored ────│                 │
      │                       │                     │                 │
      │                       │ INSERT photo row    │                 │
      │                       │────────────────────────────────────▶ │
      │                       │◀─────────────────────────────────── │
      │◀── 201 { photo } ─────│                     │                 │
      │    (with signed URLs) │                     │                 │
```

### 3.3 Timesheet Computation Flow

```
Manager (Browser)            API Server                    PostgreSQL
       │                          │                              │
       │ GET /time-entries        │                              │
       │ /timesheet?              │                              │
       │   month=2026-04          │                              │
       │─────────────────────────▶│                              │
       │                          │ Query all time_entries       │
       │                          │ WHERE started_at BETWEEN     │
       │                          │   2026-04-01 00:00 UTC       │
       │                          │   AND 2026-04-30 23:59 UTC   │
       │                          │──────────────────────────────▶
       │                          │◀── raw entries ──────────────│
       │                          │                              │
       │                          │ For each employee:           │
       │                          │   Group entries by day       │
       │                          │   (converted to Tallinn TZ)  │
       │                          │   Sum hours per day          │
       │                          │   Compute:                   │
       │                          │   - Kokku (total hours)      │
       │                          │   - TP (days with entries)   │
       │                          │   - NT (norm from schedule)  │
       │                          │   - ÜT = Kokku - NT         │
       │                          │                              │
       │◀── JSON grid ────────────│                              │
       │    { employees: [        │                              │
       │       { id, name,        │                              │
       │         days: {          │                              │
       │           "1": 8.0,      │                              │
       │           "2": null,     │                              │
       │           "3": "PõP"     │                              │
       │         },               │                              │
       │         totals: {        │                              │
       │           TP, NT, ÜT,   │                              │
       │           Kokku }        │                              │
       │       }                  │                              │
       │     ] }                  │                              │
       │                          │                              │
       │ Render sticky grid       │                              │
       │ (negative ÜT → red)     │                              │
```

---

## 4. Database Schema

### 4.1 Prisma Schema (complete)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────

model Employee {
  id                  Int              @id @default(autoincrement())
  full_name           String
  photo_url           String?
  avatar_color        String           @default("#4F46E5")
  initials            String
  group               EmployeeGroup
  status              EmployeeStatus   @default(Aktiivne)
  work_schedule       String?
  norm_hours_per_week Int              @default(40)
  project_access_all  Boolean          @default(true)
  phone               String?          @unique
  email               String?          @unique
  password_hash       String?
  language            Language         @default(et)
  time_format         TimeFormat       @default(H24)
  hourly_rate         Decimal?         @db.Decimal(10, 2)
  personal_id         String?
  birth_date          DateTime?        @db.Date
  additional_info     String?
  created_at          DateTime         @default(now()) @db.Timestamptz
  updated_at          DateTime         @updatedAt @db.Timestamptz
  archived_at         DateTime?        @db.Timestamptz

  // Relations
  roles               EmployeeRole[]
  project_access_list EmployeeProjectAccess[]
  managed_projects    Project[]        @relation("ProjectManager")
  assigned_projects   ProjectEmployee[]
  assigned_tasks      TaskAssignee[]
  time_entries        TimeEntry[]
  photos              Photo[]
  responsible_tools   Tool[]
  otp_codes           OtpCode[]
  refresh_tokens      RefreshToken[]
  acknowledgements    DocAcknowledgement[]
  doc_assignments     DocAckAssignment[]   @relation("AssignedEmployee")

  @@index([status])
  @@index([group])
}

model Role {
  id         Int            @id @default(autoincrement())
  name       String         @unique
  created_at DateTime       @default(now()) @db.Timestamptz
  employees  EmployeeRole[]
}

model EmployeeRole {
  employee_id Int
  role_id     Int
  employee    Employee @relation(fields: [employee_id], references: [id])
  role        Role     @relation(fields: [role_id], references: [id])

  @@id([employee_id, role_id])
}

model EmployeeProjectAccess {
  employee_id Int
  project_id  Int
  employee    Employee @relation(fields: [employee_id], references: [id])
  project     Project  @relation(fields: [project_id], references: [id])

  @@id([employee_id, project_id])
}

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────

model Project {
  id               Int           @id @default(autoincrement())
  name             String
  status           ProjectStatus @default(Ettevalmistuses)
  start_date       DateTime?     @db.Date
  end_date         DateTime?     @db.Date
  description      String?
  location_address String?
  location_lat     Float?
  location_lng     Float?
  contract_number  String?
  project_manager_id Int?

  // Client (inline Phase 1, extracted to CRM entity in Phase 2)
  client_company_name String?
  client_reg_code     String?
  client_contact_name String?
  client_phone        String?
  client_email        String?

  created_at       DateTime      @default(now()) @db.Timestamptz
  updated_at       DateTime      @updatedAt @db.Timestamptz
  archived_at      DateTime?     @db.Timestamptz

  // Relations
  project_manager  Employee?     @relation("ProjectManager", fields: [project_manager_id], references: [id])
  people           ProjectEmployee[]
  tags             ProjectTag[]
  tasks            Task[]
  time_entries     TimeEntry[]
  photos           Photo[]
  documents        Document[]
  tools            Tool[]
  access_grants    EmployeeProjectAccess[]

  @@index([status])
  @@index([archived_at])
}

model ProjectEmployee {
  project_id  Int
  employee_id Int
  project     Project  @relation(fields: [project_id], references: [id])
  employee    Employee @relation(fields: [employee_id], references: [id])

  @@id([project_id, employee_id])
}

model Tag {
  id          Int          @id @default(autoincrement())
  name        String
  color       String       @default("#6B7280")
  entity_type TagEntityType
  created_at  DateTime     @default(now()) @db.Timestamptz
  archived_at DateTime?    @db.Timestamptz
  projects    ProjectTag[]
  tasks       TaskTag[]

  @@unique([name, entity_type])
}

model ProjectTag {
  project_id Int
  tag_id     Int
  project    Project @relation(fields: [project_id], references: [id])
  tag        Tag     @relation(fields: [tag_id], references: [id])

  @@id([project_id, tag_id])
}

// ─────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────

model Task {
  id           Int          @id @default(autoincrement())
  name         String
  status       TaskStatus   @default(Uus)
  project_id   Int?
  template_id  Int?
  priority     Priority     @default(Keskmine)
  location_address String?
  location_lat     Float?
  location_lng     Float?
  start_time   DateTime?    @db.Timestamptz
  end_time     DateTime?    @db.Timestamptz
  created_at   DateTime     @default(now()) @db.Timestamptz
  updated_at   DateTime     @updatedAt @db.Timestamptz
  archived_at  DateTime?    @db.Timestamptz

  // Relations
  project      Project?     @relation(fields: [project_id], references: [id])
  template     TaskTemplate? @relation(fields: [template_id], references: [id])
  assignees    TaskAssignee[]
  tools        TaskTool[]
  tags         TaskTag[]
  photos       Photo[]
  time_entries TimeEntry[]

  @@index([project_id, status])
  @@index([status])
}

model TaskAssignee {
  task_id     Int
  employee_id Int
  task        Task     @relation(fields: [task_id], references: [id])
  employee    Employee @relation(fields: [employee_id], references: [id])

  @@id([task_id, employee_id])
}

model TaskTag {
  task_id Int
  tag_id  Int
  task    Task @relation(fields: [task_id], references: [id])
  tag     Tag  @relation(fields: [tag_id], references: [id])

  @@id([task_id, tag_id])
}

model TaskTemplate {
  id           Int           @id @default(autoincrement())
  name         String        @unique
  type         TemplateType  @default(general)
  sort_order   Int           @default(0)
  default_group EmployeeGroup?
  is_active    Boolean       @default(true)
  created_at   DateTime      @default(now()) @db.Timestamptz
  tasks        Task[]
}

// ─────────────────────────────────────────────
// TIME TRACKING
// ─────────────────────────────────────────────

model TimeEntry {
  id                  Int       @id @default(autoincrement())
  employee_id         Int
  project_id          Int?
  task_id             Int?
  no_project_reason   String?   // required when project_id is null
  started_at          DateTime  @db.Timestamptz
  ended_at            DateTime? @db.Timestamptz
  is_manual           Boolean   @default(false)
  needs_review        Boolean   @default(false)
  is_confirmed        Boolean   @default(false)
  created_at          DateTime  @default(now()) @db.Timestamptz
  updated_at          DateTime  @updatedAt @db.Timestamptz

  // Relations
  employee            Employee  @relation(fields: [employee_id], references: [id])
  project             Project?  @relation(fields: [project_id], references: [id])
  task                Task?     @relation(fields: [task_id], references: [id])
  pauses              Pause[]
  comments            TimeEntryComment[]

  @@index([employee_id, started_at])
  @@index([project_id])
  @@index([project_id], map: "idx_time_entries_no_project", where: "project_id IS NULL")
}

model Pause {
  id            Int       @id @default(autoincrement())
  time_entry_id Int
  pause_start   DateTime  @db.Timestamptz
  pause_end     DateTime? @db.Timestamptz
  time_entry    TimeEntry @relation(fields: [time_entry_id], references: [id], onDelete: Cascade)
}

model TimeEntryComment {
  id            Int       @id @default(autoincrement())
  time_entry_id Int
  author_id     Int
  body          String
  created_at    DateTime  @default(now()) @db.Timestamptz
  time_entry    TimeEntry @relation(fields: [time_entry_id], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────────
// PHOTOS & DOCUMENTS
// ─────────────────────────────────────────────

model Photo {
  id                Int       @id @default(autoincrement())
  s3_key            String    @unique
  thumbnail_s3_key  String?
  project_id        Int?
  task_id           Int?
  author_id         Int
  gps_lat           Float?
  gps_lng           Float?
  gps_verified      Boolean   @default(false)
  taken_at          DateTime  @db.Timestamptz
  uploaded_at       DateTime  @default(now()) @db.Timestamptz
  file_size_bytes   Int
  original_filename String

  project  Project?  @relation(fields: [project_id], references: [id])
  task     Task?     @relation(fields: [task_id], references: [id])
  author   Employee  @relation(fields: [author_id], references: [id])

  @@index([project_id])
  @@index([author_id, uploaded_at])
}

model Document {
  id                Int       @id @default(autoincrement())
  project_id        Int
  s3_key            String    @unique
  original_filename String
  mime_type         String
  file_size_bytes   Int
  uploaded_by_id    Int
  uploaded_at       DateTime  @default(now()) @db.Timestamptz

  project     Project  @relation(fields: [project_id], references: [id])

  @@index([project_id])
}

// ─────────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────────

model Tool {
  id                         Int        @id @default(autoincrement())
  name                       String
  code                       String?
  photo_s3_key               String?
  current_location_project_id Int?
  current_location_text      String?
  responsible_employee_id    Int?
  status                     ToolStatus @default(Töökorras)
  description                String?
  manufacturer               String?
  model                      String?
  created_at                 DateTime   @default(now()) @db.Timestamptz
  updated_at                 DateTime   @updatedAt @db.Timestamptz

  current_project  Project?  @relation(fields: [current_location_project_id], references: [id])
  responsible      Employee? @relation(fields: [responsible_employee_id], references: [id])
  task_assignments TaskTool[]
}

model TaskTool {
  task_id Int
  tool_id Int
  task    Task @relation(fields: [task_id], references: [id])
  tool    Tool @relation(fields: [tool_id], references: [id])

  @@id([task_id, tool_id])
}

// ─────────────────────────────────────────────
// DOCUMENT ACKNOWLEDGEMENT
// ─────────────────────────────────────────────

model InternalDocument {
  id           Int       @id @default(autoincrement())
  title        String
  description  String?
  category     String?                       // e.g. 'Ohutus', 'Reeglid', 'Koolitus'
  s3_key       String                        // path in S3 bucket
  version      Int       @default(1)
  requires_ack Boolean   @default(true)
  uploaded_by_id Int
  created_at   DateTime  @default(now()) @db.Timestamptz
  updated_at   DateTime  @updatedAt @db.Timestamptz
  archived_at  DateTime? @db.Timestamptz

  uploaded_by      Employee           @relation("DocumentUploader", fields: [uploaded_by_id], references: [id])
  assignments      DocAckAssignment[]
  acknowledgements DocAcknowledgement[]

  @@index([archived_at])
}

model DocAckAssignment {
  id          Int            @id @default(autoincrement())
  document_id Int
  employee_id Int?           // specific employee — null if group-based
  group       EmployeeGroup? // whole group — null if employee-based
  assigned_by_id Int
  assigned_at DateTime       @default(now()) @db.Timestamptz
  due_date    DateTime?      @db.Timestamptz

  document    InternalDocument @relation(fields: [document_id], references: [id])
  employee    Employee?        @relation("AssignedEmployee", fields: [employee_id], references: [id])
  assigned_by Employee         @relation("AssignedBy", fields: [assigned_by_id], references: [id])

  @@index([document_id])
  @@index([employee_id])
}

model DocAcknowledgement {
  id               Int      @id @default(autoincrement())
  document_id      Int
  employee_id      Int
  document_version Int      // version at time of acknowledgement
  acknowledged_at  DateTime @default(now()) @db.Timestamptz

  document  InternalDocument @relation(fields: [document_id], references: [id])
  employee  Employee         @relation(fields: [employee_id], references: [id])

  @@unique([document_id, employee_id, document_version])
  @@index([employee_id])
}

// ─────────────────────────────────────────────
// AUTH SUPPORT
// ─────────────────────────────────────────────

model OtpCode {
  id          Int       @id @default(autoincrement())
  employee_id Int?
  phone       String
  code_hash   String
  expires_at  DateTime  @db.Timestamptz
  used_at     DateTime? @db.Timestamptz
  created_at  DateTime  @default(now()) @db.Timestamptz

  employee Employee? @relation(fields: [employee_id], references: [id])

  @@index([phone, expires_at])
}

model RefreshToken {
  id          Int       @id @default(autoincrement())
  employee_id Int
  token_hash  String    @unique
  expires_at  DateTime  @db.Timestamptz
  revoked_at  DateTime? @db.Timestamptz
  created_at  DateTime  @default(now()) @db.Timestamptz

  employee Employee @relation(fields: [employee_id], references: [id])
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum ProjectStatus {
  Hinnapakkumises
  Ettevalmistuses
  Töös
  Lõpetatud
}

enum TaskStatus {
  Uus
  Teha
  Töös
  Tehtud
}

enum Priority {
  Madal
  Keskmine
  Kõrgeim
}

enum EmployeeGroup {
  Paigaldus
  Tootmine
  Kontor
  Ladu
}

enum EmployeeStatus {
  Aktiivne
  Arhiveeritud
}

enum ToolStatus {
  Töökorras
  Rikki
  Hoolduses
}

enum Language {
  et
  ru
}

enum TimeFormat {
  H24
  H12
}

enum TagEntityType {
  project
  task
}

enum TemplateType {
  production
  general
}

```

---

## 5. API Layer Design

### 5.1 Request Lifecycle

```
HTTP Request
    │
    ▼
Nginx (SSL termination)
    │
    ▼
NestJS HTTP Adapter (Express)
    │
    ▼
Global Middleware
├── CORS (configured origins — also permits requests with no Origin header for native app clients)
├── Helmet (security headers)
├── Request logging
└── Rate limiting (Redis-backed, per IP)
    │
    ▼
Route matching
    │
    ▼
Guards (in order)
├── JwtAuthGuard (validates Bearer token, sets req.user)
├── RolesGuard (checks @Roles decorator)
└── ProjectAccessGuard (checks project_access field)
    │
    ▼
Interceptors
├── SensitiveFieldsInterceptor (strips hourly_rate etc for non-admin)
└── ResponseTransformInterceptor (wraps lists in { data, meta })
    │
    ▼
Pipes
├── ValidationPipe (class-validator, whitelist, forbidNonWhitelisted)
└── ParsePaginationPipe (page, limit, sort defaults)
    │
    ▼
Controller method
    │
    ▼
Service (business logic)
    │
    ▼
Prisma client (database)
    │
    ▼
Exception filters
└── HttpExceptionFilter (consistent error format)
```

### 5.2 Pagination Standard

All list endpoints accept:
```
GET /api/v1/projects?page=1&limit=20&sort_by=created_at&sort_dir=desc
```

Response:
```json
{
  "data": [ ... ],
  "meta": {
    "total": 1562,
    "page": 1,
    "limit": 20,
    "total_pages": 79
  }
}
```

---

## 6. Real-time Architecture

### 6.1 Socket.io Architecture

```
Browser (Praegu page)              NestJS TimeTrackingGateway
        │                                    │
        │  WS handshake                      │
        │  auth: { token: "Bearer xxx" }     │
        │──────────────────────────────────▶ │
        │                                    │ validateJwt(token)
        │◀──────── connected ──────────────  │
        │                                    │
        │  join room: 'timers'               │
        │──────────────────────────────────▶ │
        │                                    │
        │  [Employee starts timer via REST]  │
        │  [TimeTrackingService calls        │
        │   gateway.emitTimerStarted()]      │
        │                                    │
        │◀── event: 'timer:started' ──────── │
        │    { employee_id, employee_name,   │
        │      project_name, task_name,      │
        │      started_at }                  │
        │                                    │
        │  Update local state (Zustand)      │
        │  Show employee card with counter   │
```

### 6.2 Document Acknowledgement Flow

```
Admin (Browser)              NestJS DocAckController       Employee (PWA)
        │                              │                          │
        │ POST /internal-documents     │                          │
        │ /upload-url                  │                          │
        │─────────────────────────────▶│                          │
        │◀── { upload_url, s3_key } ───│                          │
        │                              │                          │
        │ PUT blob → S3 directly       │                          │
        │                              │                          │
        │ POST /internal-documents     │                          │
        │ { s3_key, title, version:1 } │                          │
        │─────────────────────────────▶│ INSERT InternalDocument  │
        │◀── { document } ─────────────│                          │
        │                              │                          │
        │ POST /internal-documents     │                          │
        │ /:id/assign                  │                          │
        │ { group: 'Paigaldus' }       │                          │
        │─────────────────────────────▶│ INSERT DocAckAssignment  │
        │◀── 201 ──────────────────────│                          │
        │                              │                          │
        │                              │ GET /internal-documents  │
        │                              │ /my                      │
        │                              │◀─────────────────────────│
        │                              │ Query assignments +      │
        │                              │ acknowledgements         │
        │                              │──────────────────────────▶
        │                              │ { pending: [...] }       │
        │                              │                          │
        │                              │ POST /internal-documents │
        │                              │ /:id/acknowledge         │
        │                              │◀─────────────────────────│
        │                              │ Validate assignment      │
        │                              │ INSERT DocAcknowledgement│
        │                              │ (BR-016, BR-018)         │
        │                              │──────────────────────────▶
        │                              │ 201 { acknowledged_at }  │
```

### 6.3 Reconnection Strategy

The Socket.io client is configured with:
```typescript
const socket = io(WS_URL, {
  auth: { token },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,       // start 1s
  reconnectionDelayMax: 30000,   // max 30s
  randomizationFactor: 0.5,
});
```

On reconnection, the client re-subscribes to all rooms it was previously in (handled in `onConnect` callback in `lib/socket.ts`).

---

## 7. File Storage Architecture

### 7.1 S3 Bucket Policy

```
lumico-files/          (private bucket, no public access)
├── photos/
│   └── YYYY/MM/       (e.g., 2026/04/)
│       ├── {uuid}.jpg           (original)
│       └── {uuid}_thumb.jpg     (320x240, quality 80)
└── documents/
    └── projects/{project_id}/
        └── {uuid}_{sanitized_original_name}
```

### 7.2 Signed URL Expiry

| Use case | Expiry |
|---|---|
| Photo read (lightbox, gallery) | 1 hour |
| Document read (download) | 15 minutes |
| Photo upload (pre-signed PUT) | 15 minutes |
| Thumbnail read (grid) | 1 hour |

Signed URLs are generated on-demand by the API whenever a Photo or Document record is serialized for a response. They are never stored in the database.

### 7.3 Thumbnail Generation

Server-side with `sharp`:
```typescript
await sharp(inputBuffer)
  .resize(320, 240, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 80 })
  .toBuffer();
```

Thumbnails are generated synchronously during the metadata POST (after S3 upload). If thumbnail generation fails, the photo is still saved without a thumbnail — gallery falls back to the original with CSS contain.

---

## 8. Authentication & Authorization Flow

### 8.1 JWT Payload Structure

```typescript
interface JwtPayload {
  sub: number;          // employee_id
  roles: string[];      // ['Administraator', 'Tootmisspetsialist']
  group: EmployeeGroup; // 'Kontor'
  language: 'et' | 'ru';
  iat: number;
  exp: number;
}
```

### 8.2 Authorization Matrix

| Resource | Action | Required Role | Own Data Exception |
|---|---|---|---|
| Projects | List | Any authenticated | Only own projects if project_access is restricted |
| Projects | Create | Administraator | — |
| Projects | Edit | Administraator | — |
| Tasks | List | Any authenticated | Assignee can view own tasks |
| Tasks | Create | Administraator, Tootmisspetsialist, Paigaldusspetsialist | — |
| Tasks | Edit status | Any authenticated assignee | Only assigned tasks |
| Time entries | Create (timer) | Any authenticated | Own entries only |
| Time entries | Create (manual) | Administraator | — |
| Time entries | View | Administraator sees all; others see own | Yes |
| Timesheet | View all employees | Administraator | Own row only for others |
| Timesheet | Export | Administraator | — |
| Employees | List (basic) | Any authenticated | — |
| Employees | Create | Administraator | — |
| Employees | Edit | Administraator | Own profile (non-sensitive) |
| Employees | Sensitive fields | Administraator only | — |
| Tools | List | Any authenticated | — |
| Tools | Edit | Administraator, Laospetsialist | — |
| Settings | All | Administraator | — |

### 8.3 OTP Flow

```
1. Employee calls POST /auth/otp/request { phone: "+37212345678" }
2. API generates 6-digit OTP
3. API stores SHA-256(OTP) in Redis with key "otp:{phone}" and TTL 300s
4. API sends OTP via SMS provider
5. Employee calls POST /auth/otp/verify { phone, code }
6. API retrieves hash from Redis, compares SHA-256(code)
7. On match: delete Redis key, issue access + refresh tokens
8. On fail: increment attempt counter in Redis (max 5 attempts, then 15min lockout)
```

### 8.4 Refresh Token Flow (Dual-Mode)

Token issuance (step 7 above) and every subsequent refresh follow the same dual-mode response:

```
POST /api/v1/auth/refresh

Accepted inputs (in priority order):
  1. Cookie:  refresh_token=<token>   (httpOnly cookie, sent automatically by browser)
  2. Body:    { "refresh_token": "<token>" }  (explicit body field for native clients)

On valid token:
  a. Invalidate old token in DB (hash cleared)
  b. Generate new access token (15 min) + new refresh token (7 days)
  c. Set-Cookie: refresh_token=<new>; HttpOnly; Secure; SameSite=Strict
  d. Respond:  { "access_token": "...", "refresh_token": "..." }

On invalid/missing token:
  → 401 Unauthorized

Token rotation is atomic: old token invalidated before new one is written.
```

**Why both modes from Phase 1:**
- Web/PWA clients rely on the cookie; they ignore the body field.
- Future native apps cannot use httpOnly cookies — they read `refresh_token` from the body and store it in Keychain (iOS) / Keystore (Android).
- Implementing both now means zero backend changes when native apps are built.

---

## 9. Module Dependency Map

```
AppModule
├── DatabaseModule (global — Prisma client injected everywhere)
├── AuthModule
│   ├── EmployeesModule (for user lookup)
│   └── [Redis — for OTP storage]
├── ProjectsModule
│   └── DatabaseModule
├── TasksModule
│   └── DatabaseModule
├── TimeTrackingModule
│   ├── DatabaseModule
│   ├── TimeTrackingGateway (WebSocket)
│   └── EmployeesModule (for norm hours in timesheet)
├── EmployeesModule
│   ├── DatabaseModule
│   └── InvitationService (SMS + email)
├── PhotosModule
│   ├── DatabaseModule
│   └── S3Service (pre-signed URLs, thumbnail generation)
├── DocumentsModule
│   ├── DatabaseModule
│   └── S3Service
├── ToolsModule
│   └── DatabaseModule
├── DocAcknowledgementModule
│   ├── DatabaseModule
│   └── S3Service (presigned upload URL for internal documents)
└── SettingsModule
    └── DatabaseModule
```

**Shared services (global providers):**
- `S3Service` — S3 operations, pre-signed URLs, thumbnail generation.
- `DatabaseService` — Prisma client wrapper (extends PrismaClient).
- `ConfigService` — environment variables (NestJS ConfigModule).

---

## 10. Deployment Architecture

### 10.1 Production Server Layout

```
VPS (Ubuntu 22.04)
├── /opt/lumico/
│   ├── docker-compose.prod.yml
│   ├── .env.prod                    # injected by CI/CD, not in git
│   └── data/
│       ├── postgres/                # PostgreSQL data volume
│       └── redis/                   # Redis data volume
│
└── Docker containers:
    ├── nginx       :80, :443
    ├── web         :3000 (internal)
    ├── api         :3001 (internal)
    ├── postgres    :5432 (internal)
    ├── redis       :6379 (internal)
    └── pgbouncer   :6432 (internal)
```

### 10.2 Nginx Configuration (key sections)

```nginx
server {
    listen 443 ssl;
    server_name app.lumico.ee;

    # SSL via Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/app.lumico.ee/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.lumico.ee/privkey.pem;

    # API
    location /api/ {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket upgrade
    location /socket.io/ {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Next.js
    location / {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

### 10.3 Deployment Steps (automated via GitHub Actions)

```bash
# On CI:
docker build -t ghcr.io/lumico/api:${SHA} apps/api/
docker build -t ghcr.io/lumico/web:${SHA} apps/web/
docker push ghcr.io/lumico/api:${SHA}
docker push ghcr.io/lumico/web:${SHA}

# On VPS (via SSH):
cd /opt/lumico
docker pull ghcr.io/lumico/api:${SHA}
docker pull ghcr.io/lumico/web:${SHA}
# Update .env IMAGE_TAG=${SHA}
docker compose -f docker-compose.prod.yml up -d --no-build
# Run pending migrations:
docker compose exec api npx prisma migrate deploy
```

---

## 11. Security Architecture

### 11.1 Defense in Depth

| Layer | Control |
|---|---|
| Network | HTTPS only; HTTP redirects to HTTPS |
| API | JWT authentication on all routes |
| API | Role-based authorization (Guards) |
| API | Input validation (ValidationPipe, class-validator) |
| API | Rate limiting (Redis-backed, per IP) |
| API | Helmet (security headers: CSP, HSTS, X-Frame-Options) |
| Database | Prisma parameterized queries (SQL injection prevention) |
| Database | PgBouncer for connection management |
| Files | S3 pre-signed URLs (no public bucket access) |
| Auth | OTP rate limiting (max 5 attempts, 15 min lockout) |
| Auth | Refresh token rotation (prevents replay) |
| Auth | Refresh tokens dual-mode: httpOnly cookie (web) + response body (native). Cookie always set; body always returned. See §8.4. |
| Sensitive data | Serializer-level field stripping for non-admin |

### 11.2 Data Privacy

- Employee sensitive data (`hourly_rate`, `personal_id`, `birth_date`) stored in main DB but never returned unless requester is Administraator.
- Photos served via expiring signed URLs — never public direct S3 links.
- GPS coordinates stored but not displayed to employees (only admins see the map pin).
- GDPR considerations for Estonian employees: `personal_id` (isikukood) is considered personal data — encrypt at rest in Phase 2.

---

## 12. Error Handling Strategy

### 12.1 Backend Error Classification

| HTTP Status | When | Example |
|---|---|---|
| 400 Bad Request | Validation failure, business rule violation | "Timer requires project or reason" |
| 401 Unauthorized | Missing or invalid JWT | "Access token expired" |
| 403 Forbidden | Valid JWT but insufficient permissions | "Requires Administraator role" |
| 404 Not Found | Entity not found | "Project 999 not found" |
| 409 Conflict | State conflict | "Employee already has an active timer" |
| 422 Unprocessable Entity | Semantic validation error | "End time must be after start time" |
| 500 Internal Server Error | Unexpected server error | Generic message (details in logs only) |

### 12.2 Error Response Format

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Timer cannot start without project selection. Provide project_id or no_project_reason (min 10 chars).",
  "field": "project_id"
}
```

`field` is optional — included when the error is tied to a specific input field to enable frontend field-level error display.

### 12.3 Frontend Error Handling

- **4xx errors**: display a toast notification with the API error message.
- **401**: clear auth state, redirect to login page.
- **500 errors**: display generic "Something went wrong. Please try again." toast.
- **Network errors (offline)**: display persistent offline banner; PWA service worker serves cached data.
- **Timer start failure**: inline error inside the TimerStartModal, do not dismiss the modal.

---

*Document maintained by LUMICO development team. Last updated: 2026-04-05.*
