# Product Requirements Document — Remato Replacement System
**Project:** LUMICO Field & Production Management Platform
**Company:** LUMICO (lumico.ee) — Window/Glass Manufacturing & Installation
**Version:** 1.0 — Phase 1: Operations Core
**Date:** 2026-04-05
**Status:** Approved for Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Context](#2-company-context)
3. [Problem Statement](#3-problem-statement)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [User Personas & Roles](#5-user-personas--roles)
6. [Phase Scope](#6-phase-scope)
7. [Functional Requirements — Module by Module](#7-functional-requirements--module-by-module)
8. [Data Models](#8-data-models)
9. [Business Rules](#9-business-rules)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Out of Scope (Phase 2)](#12-out-of-scope-phase-2)

---

## 1. Executive Summary

LUMICO is replacing Remato — their current project and workforce management tool — with a purpose-built platform. The replacement must handle all operational workflows: project lifecycle management, task assignment and templates, time tracking with mandatory project linkage, team scheduling, GPS-verified photo documentation, tool tracking, document management, and internal document acknowledgement.

This PRD covers **Phase 1: Operations Core**. Phase 2 (budget/margin, CRM, materials, accounting integration) is documented separately.

---

## 2. Company Context

| Attribute | Detail |
|---|---|
| Company | LUMICO (lumico.ee) |
| Industry | Window & glass manufacturing + installation |
| Location | Jüri / Harjumaa, Estonia |
| Phone prefix | +372 |
| Team size | ~22 active employees |
| Historical projects | 1 562 in Remato |
| Primary UI language | Estonian (ET) |
| Team language | Bilingual ET/RU (e.g., task names like "Paigaldus/Установка") |
| Timezone | Europe/Tallinn (EET/EEST, UTC+2/+3) |

---

## 3. Problem Statement

### 3.1 Critical Pain Points in Remato

**Pain Point 1 — Unassigned Time (344 hours)**
Time entries exist labeled "* Projekt määramata > * Töö määramata" (project unassigned / task unassigned). Employees start the timer without selecting a project or task. This makes payroll reconciliation and project costing impossible for those hours.

**Pain Point 2 — No Standalone Client Entity**
Client information (company name, reg code, contact, phone, email) is embedded inline inside each project. If LUMICO works with the same client on 10 projects, the data is duplicated 10 times and cannot be updated in one place. Phase 1 keeps clients inline but structures the schema to allow CRM extraction in Phase 2.

**Pain Point 3 — Budget Module Unused**
The Eelarve (budget) tab exists in Remato projects but is effectively unused. Teams lack a clear workflow for creating quotes and tracking margin. This is addressed in Phase 2.

### 3.2 Requirements Arising from Pain Points

- Time tracking must **enforce** project+task selection before a timer can start, or require an explicit "no project" confirmation with a written reason.
- The client sub-object inside Project must be structured with all required fields from day 1, ready for CRM extraction later.
- Zero-duration time entries must be prevented/flagged.

---

## 4. Goals & Success Metrics

### 4.1 Goals

1. Zero unassigned time entries — every timer must link to a project+task or carry an explicit reason.
2. Complete operational visibility — managers can see who is doing what, where, right now.
3. Accurate timesheets — monthly hour grids export correctly to Excel for payroll.
4. Photo documentation with GPS — field workers upload photos that store coordinates; photos never save to personal gallery.
5. Bilingual support — all UI strings available in ET and RU; each employee selects their language in profile.
6. Mobile-first field access — field workers use PWA on Android/iOS with camera and GPS.

### 4.2 Success Metrics

| Metric | Target |
|---|---|
| Unassigned time entries | 0 per month (down from 344 h) |
| Timer start without project | Blocked unless reason provided |
| Timesheet export accuracy | 100% match with manual count |
| GPS photo capture rate | ≥ 90% of field photos have coordinates |
| System uptime | ≥ 99.5% |
| Page load (dashboard) | < 2 s on 4G connection |

---

## 5. User Personas & Roles

### 5.1 Employee Roles (system roles, not groups)

| Role | Estonian | Description |
|---|---|---|
| Administrator | Administraator | Full system access, manages all settings and people |
| Production Specialist | Tootmisspetsialist | Manages factory tasks, views production schedule |
| Installation Specialist | Paigaldusspetsialist | Field worker, mobile-heavy usage, GPS photos |
| Warehouse Specialist | Laospetsialist | Manages stock and tools |
| Packer | Pakkija | Factory packing tasks, limited access |

One employee can hold multiple roles simultaneously (e.g., Julian Kosheliev: Tootmisspetsialist + Paigaldusspetsialist).

### 5.2 Employee Groups (organizational units)

| Group | Members | Primary use |
|---|---|---|
| Paigaldus | Installation field workers | Mobile, GPS, on-site tasks |
| Tootmine | Factory/production workers | Production task queue |
| Kontor | Office staff | Project management, reporting |
| Ladu | Warehouse staff | Tools, inventory |

### 5.3 Access Control Summary

- **Administraator**: all modules, all employees, all projects, settings.
- **Tootmisspetsialist**: projects assigned to them, production tasks, own time.
- **Paigaldusspetsialist**: projects assigned to them, installation tasks, own time, GPS photos.
- **Laospetsialist**: tools module, warehouse tasks, own time.
- **Pakkija**: own tasks, own time only.
- Employee's `project_access` field can be set to ALL or a specific list of projects.

---

## 6. Phase Scope

### Phase 1 — Operations Core (this document)

| Module | Included |
|---|---|
| Projects (without Eelarve budget tab) | Yes |
| Tasks + 19 Templates | Yes |
| Time Tracking (mandatory project assignment) | Yes |
| Team: Praegu (live), Tunnitabel (timesheet), Aruanded (reports), Inimesed (people) | Yes |
| Gallery with GPS photo capture | Yes |
| Documents per project (upload, list, download) | Yes |
| Document Acknowledgement (internal policies, safety docs, mandatory read + confirm) | Yes |
| Settings: roles, groups, tags, company info | Yes |
| Tools (basic: list, status, assign to project) | Yes |
| PWA (mobile) | Yes |
| ET + RU i18n | Yes |

### Phase 2 — Business Layer (separate PRD)

- Eelarve (budget, margin, quote generation)
- Clients as standalone CRM entity
- Custom fields (Lisaväljad) for projects and people
- Materials module (Materjalid)
- Full Tools module (calendar, reports, maintenance history)
- Merit Aktiva accounting integration
- Chat / Vestlus (internal messaging, project group chats)

---

## 7. Functional Requirements — Module by Module

---

### 7.1 Authentication & Onboarding

**FR-AUTH-01** — Login via phone number OTP or email+password.
**FR-AUTH-02** — JWT access token (short-lived, 15 min) + refresh token (long-lived, 7 days, rotated on every use). The refresh endpoint must be dual-mode: accept the refresh token from an httpOnly cookie (web/PWA clients) **or** from the `refresh_token` field in the request body (future native mobile clients). Both modes are implemented in Phase 1 so that no backend change is needed when native apps are introduced. The response always sets the httpOnly cookie **and** returns `{ refresh_token }` in the body.
**FR-AUTH-03** — When an Administrator saves a new employee's phone or email, the system automatically sends an invitation (SMS or email) with a registration link.
**FR-AUTH-04** — Employee selects preferred language (ET/RU) and time format (24h/12h) in profile settings. UI re-renders immediately on change.
**FR-AUTH-05** — All sessions store timezone as Europe/Tallinn; all API timestamps in UTC; all display in local time.

---

### 7.2 Projects Module

#### 7.2.1 Project List

**FR-PROJ-01** — Projects display in three views: List, Calendar, Gallery.
**FR-PROJ-02** — List view columns: ID (QUOT-xxx or P-xxx prefix), Name, Status, Client, Start Date, End Date, Project Manager, Tags.
**FR-PROJ-03** — Projects are filterable by: Status, Tags, Project Manager, Date Range.
**FR-PROJ-04** — Projects are searchable by name, client name, contract number.
**FR-PROJ-05** — Status badge colors:
  - Hinnapakkumises (quoting) — yellow/amber
  - Ettevalmistuses (preparing) — blue
  - Töös (in progress) — green
  - Lõpetatud (completed) — grey

**FR-PROJ-06** — Project prefix: QUOT- for status Hinnapakkumises; P- for all other statuses. Prefix changes automatically on status change.

#### 7.2.2 Project Create/Edit

**FR-PROJ-07** — Required fields: name, status. All other fields optional at creation.
**FR-PROJ-08** — Location field uses geocoded address (Estonian address lookup). Stores lat/lng alongside human-readable address.
**FR-PROJ-09** — Client sub-form fields: company_name, reg_code (Estonian business registry format EV-XXXXXXXX), contact_name, phone (+372), email.
**FR-PROJ-10** — People field: multi-select from active employees list.
**FR-PROJ-12** — Tags: multi-select from company tag library (managed in Settings).
**FR-PROJ-13** — Contract number: free text, optional.

#### 7.2.3 Project Inner Tabs

Each project detail page has tabs:

**Tab: Tööd (Tasks)**
- Lists all tasks linked to this project.
- Allows creating new tasks pre-linked to this project.
- Task status pipeline visible.

**Tab: Kalender (Calendar)**
- Monthly/weekly calendar showing tasks and time entries for this project.
- Employees shown as color-coded rows or events.

**Tab: Dokumendid (Documents)**
- File upload (PDF, DOCX, XLSX, images).
- Files listed with: name, type icon, uploaded by, uploaded at, size, download link.
- No version control in Phase 1.

**Tab: Galerii (Gallery)**
- Grid of photos linked to this project or its tasks.
- Each photo shows: thumbnail, taken_at, author name, GPS indicator (if coordinates available).
- Click to open lightbox with full image + metadata.
- Photos uploaded here must NOT save to employee personal gallery.

**Tab: Eelarve (Budget)**
- Placeholder tab in Phase 1 — shows "Tulemas Phase 2 / Будет в Phase 2" message.

---

### 7.3 Tasks Module

#### 7.3.1 Task List

**FR-TASK-01** — Tasks display in two views: List, Calendar.
**FR-TASK-02** — List columns: ID, Name, Status, Project (linked), Priority, Assignees (avatars), Start Time, End Time, Tags.
**FR-TASK-03** — Tasks with no project show a visual indicator (e.g., dash or "—" in project column). This is a valid state.
**FR-TASK-04** — Status pipeline: Uus → Teha → Töös → Tehtud. Status can be changed by drag-and-drop (Kanban) or dropdown.
**FR-TASK-05** — Priority colors: Madal (low) = grey, Keskmine (medium) = orange, Kõrgeim (highest) = red.
**FR-TASK-06** — Filter by: Status, Priority, Assignee, Project, Tags, Date Range.
**FR-TASK-07** — Search by task name.

#### 7.3.2 Task Create/Edit

**FR-TASK-08** — Required fields: name, status. Project is optional.
**FR-TASK-09** — Template selection: when creating a task, user can pick from 19 predefined templates. Template fills name and sets default assignee group.
**FR-TASK-10** — Assignees: multi-select from active employees.
**FR-TASK-11** — Tools: multi-select from tools library (assign tools to task).
**FR-TASK-12** — Photos can be attached to a task directly (camera capture on mobile, file upload on desktop).
**FR-TASK-13** — Location: optional address field (same geocoder as projects).

#### 7.3.3 Task Templates

**FR-TASK-14** — 19 templates pre-seeded in system. Templates are manageable in Settings > Tasks.

Production sequence templates (ordered 1–12):

| # | Name (ET) | Type |
|---|---|---|
| 1 | Tellimuse ettevalmistus | Production |
| 2 | Materjali ettevalmistus | Production |
| 3 | Lõikamine | Production |
| 4 | Freesimine | Production |
| 5 | Profilli liimimine klaasile | Production |
| 6 | Liimi pealekandmine | Production |
| 7 | Kuivamine | Production |
| 8 | Värvimine | Production |
| 9 | Komplekteerimine ja kiletamine | Production |
| 10 | Pakkimine | Production |
| 11 | Transport | Production |
| 12 | Paigaldus | Production |

General templates:

| # | Name (ET) | Type |
|---|---|---|
| 13 | Konsultatsioon | General |
| 14 | Koolitus | General |
| 15 | Kontor | General |
| 16 | Inventuur | General |
| 17 | Kaubik | General |
| 18 | Mõõtmine | General |
| 19 | Prügivedu | General |

**FR-TASK-15** — Administrators can add, edit, and deactivate templates.

---

### 7.4 Time Tracking Module (Tööaeg)

This is the most critical module. The primary goal is to eliminate unassigned time.

#### 7.4.1 Timer — Start Flow (CRITICAL)

**FR-TIME-01** — Employee opens time tracking. They see a large "Start Timer" button.
**FR-TIME-02** — Tapping "Start Timer" opens a mandatory pre-start modal with:
  - Project selector (searchable dropdown, shows active projects the employee has access to)
  - Task selector (filtered to tasks in selected project, or all unlinked tasks)
  - OR: a toggle "No project / Projekt puudub" with a **required** text reason field (minimum 10 characters).

**FR-TIME-03** — Timer cannot start until either (a) project+task selected, OR (b) "no project" confirmed with reason.
**FR-TIME-04** — After start: timer shows elapsed time, project name, task name (or "No project: [reason]") live on screen.
**FR-TIME-05** — Employee can add notes (comments) to the running timer at any time.
**FR-TIME-06** — Pause/resume: timer supports pauses. Each pause records pause_start and pause_end. Duration excludes pauses.
**FR-TIME-07** — Stop timer: records ended_at. Duration is computed as (ended_at - started_at) - sum(pauses).
**FR-TIME-08** — Zero-duration entries (ended_at == started_at) are invalid — show error in red, prevent save.

#### 7.4.2 Manual Entry

**FR-TIME-09** — Administrators and managers can create manual time entries for any employee.
**FR-TIME-10** — Manual entries are visually marked with a hand icon.
**FR-TIME-11** — Manual entries still require project+task selection or a "no project" reason.
**FR-TIME-12** — `needs_review` flag can be set on any entry; flagged entries appear in a review queue for managers.

#### 7.4.3 Time Entry List

**FR-TIME-13** — Default view: current employee's entries, current week.
**FR-TIME-14** — Filter by: Employee, Project, Task, Date Range.
**FR-TIME-15** — Each row shows: employee avatar, date, start time, end time, duration, project name, task name, pause count, notes indicator, is_manual icon, needs_review flag.
**FR-TIME-16** — Zero-duration entries shown with red background/border.
**FR-TIME-17** — Entries without project show amber warning indicator.

#### 7.4.4 Timesheet (Tunnitabel)

**FR-TIME-18** — Monthly grid view:
  - Rows: one per active employee
  - Columns: days of the month (1–31, only days ≤ days_in_month shown)
  - Cell content: hours worked (e.g., "8.5"), "PõP" for vacation, or empty.

**FR-TIME-19** — Per-employee computed row totals:
  - TP — total workdays in month with any time logged
  - NT — norm hours (based on employee's `norm_hours_per_week` and working calendar)
  - ÜT — overtime = (total hours logged) - NT. Can be negative (hour deficit). Display negative in red.
  - Kokku — total hours logged in month.

**FR-TIME-20** — Export timesheet to Excel (.xlsx). Format must match existing LUMICO Excel template structure.
**FR-TIME-21** — Timesheet is read-only for non-admin users (employees see only their own row in a personal view).

#### 7.4.5 Reports (Aruanded)

**FR-TIME-22** — Summary report: hours per employee per project for a date range.
**FR-TIME-23** — Detailed report: all time entries with filters, exportable to CSV.
**FR-TIME-24** — Unassigned time report: lists all entries with no project, with employee name, date, duration, and reason.

---

### 7.5 Team Module (Meeskond)

#### 7.5.1 Praegu (Right Now — Live View)

**FR-TEAM-01** — Shows all employees currently clocked in, in real-time (WebSocket updates, no manual refresh).
**FR-TEAM-02** — Each active card shows: employee photo/avatar, name, current project, current task, elapsed time (live counter), location (if GPS available from last photo or check-in).
**FR-TEAM-03** — Employees not clocked in are shown in a separate "Available" or "Offline" section.
**FR-TEAM-04** — Admin can click an employee card to view their current timer details and stop it if necessary (with a note).

#### 7.5.2 Töögraafik (Work Schedule)

**FR-TEAM-05** — Weekly calendar view of all employees' planned work hours.
**FR-TEAM-06** — Employees can be assigned shift blocks.
**FR-TEAM-07** — Vacation (PõP) can be entered per employee per day.

#### 7.5.3 Inimesed (People — Employee List)

**FR-TEAM-08** — Lists all employees (active + archived toggle).
**FR-TEAM-09** — Card/row shows: photo, name, roles (badges), group, status.
**FR-TEAM-10** — Click to open employee detail page.

#### 7.5.4 Employee Detail / Edit

**FR-TEAM-11** — Fields (see data model in Section 8). Sensitive fields (hourly_rate, personal_id, birth_date) visible only to Administraator.
**FR-TEAM-12** — Roles: multi-select from role list (managed in Settings > People > Roles).
**FR-TEAM-13** — Group: single-select dropdown (Paigaldus, Tootmine, Kontor, Ladu).
**FR-TEAM-14** — `project_access`: either ALL or specific project list. Default: ALL.
**FR-TEAM-15** — When phone or email saved for the first time: system sends invitation automatically.
**FR-TEAM-16** — Archive employee: sets status to Arhiveeritud, removes from active lists, preserves all historical data.
**FR-TEAM-17** — Avatar auto-generated from initials with a consistent color derived from employee ID if no photo uploaded.

---

### 7.6 Gallery Module

**FR-GAL-01** — Company-wide gallery: all photos from all projects, filterable by project, employee, date range.
**FR-GAL-02** — Photo upload sources: camera capture (mobile PWA), file picker (desktop).
**FR-GAL-03** — On mobile: camera capture must NOT save the photo to the device's personal gallery/roll. Photo goes directly to server.
**FR-GAL-04** — GPS coordinates: when a photo is taken on a device with location permission, coordinates are captured from the device at capture time. Stored as gps_lat, gps_lng.
**FR-GAL-05** — `gps_verified` boolean: initially true if device provided coordinates. Admin can manually toggle to false if coordinates are suspicious.
**FR-GAL-06** — Each photo stores: file_url, thumbnail_url, project_id, task_id, author_id, gps_lat, gps_lng, gps_verified, taken_at, uploaded_at.
**FR-GAL-07** — Lightbox view shows full photo + all metadata + map pin if GPS available.
**FR-GAL-08** — Photos are linked at upload time to the current project and task context (pre-fills from where upload was triggered).

---

### 7.7 Tools Module (Tööriistad)

**FR-TOOL-01** — Tool list with columns: name, code, status, current location, responsible employee.
**FR-TOOL-02** — Tool statuses: Töökorras (working), Rikki (broken), Hoolduses (in maintenance). Color-coded.
**FR-TOOL-03** — Tool can be assigned to a project or a free-text location string.
**FR-TOOL-04** — Tool detail: name, code, photo, manufacturer, model, description, current_location, responsible employee, status.
**FR-TOOL-05** — Tools can be assigned to tasks (multi-select in task form).
**FR-TOOL-06** — Tool list is filterable by status and current location/project.

---

### 7.8 Document Acknowledgement Module (Dokumentide Kinnitus)

This module ensures employees read and confirm internal company documents: safety instructions, work rules, policies, onboarding materials.

#### 7.8.1 Admin — Document Management

**FR-DACK-01** — Administrator uploads internal documents (PDF, DOCX) via the same presigned S3 flow used for project documents.
**FR-DACK-02** — Each document has: title, description, category (e.g., "Ohutus" / safety, "Reeglid" / rules, "Koolitus" / training), version number, and uploaded_by.
**FR-DACK-03** — When a new version of a document is uploaded (PATCH with new file), version counter increments automatically. Prior acknowledgements are invalidated — assigned employees must re-acknowledge.
**FR-DACK-04** — Administrator assigns documents to: specific employees (multi-select) OR entire groups (Paigaldus, Tootmine, Kontor, Ladu). Both can be combined.
**FR-DACK-05** — Assignment can include an optional due date.
**FR-DACK-06** — Administrator sees a compliance matrix for each document: rows = assigned employees, columns = status (Acknowledged / Pending / Overdue). Exportable to Excel.
**FR-DACK-07** — Documents can be soft-archived (hidden from employee view, assignments preserved for audit).

#### 7.8.2 Employee — Acknowledgement Flow

**FR-DACK-08** — Employee sees a dedicated "Minu dokumendid" (My Documents) section in the app. Shows all documents assigned to them or their group, with status: Ootab kinnitust (pending) / Kinnitatud (acknowledged).
**FR-DACK-09** — Pending documents display a badge/counter in the sidebar navigation.
**FR-DACK-10** — Employee opens a document (rendered in-browser or downloaded), then taps/clicks "Olen lugenud ja nõustun" (I have read and agree).
**FR-DACK-11** — Confirmation records: employee_id, document_id, document_version, acknowledged_at timestamp. Cannot be undone.
**FR-DACK-12** — If a new document version is published, the acknowledgement badge reappears for all assigned employees regardless of prior acknowledgement.

---

### 7.9 Settings Module (Seaded)

#### 7.9.1 Personal Settings

**FR-SET-01** — Profile: full name, photo, phone, email.
**FR-SET-02** — Language: ET / RU selector. Applies immediately.
**FR-SET-03** — Time format: 24h / 12h selector.
**FR-SET-04** — Notifications: push (PWA), email — toggles per notification type.

#### 7.9.2 Company Settings

**FR-SET-05** — Company name, logo upload, country (Estonia default), units (metric).
**FR-SET-06** — Working calendar: define working days and public holidays for NT (norm hours) calculation.

#### 7.9.3 Project Settings

**FR-SET-07** — Tags: create, rename, color-assign, delete (soft delete if in use) tags for projects.
**FR-SET-08** — Custom fields (Lisaväljad): Phase 2. Placeholder in Phase 1.

#### 7.9.4 People Settings

**FR-SET-09** — Roles: create, rename, delete roles. Cannot delete a role assigned to active employees.
**FR-SET-10** — Groups: the four groups are fixed in Phase 1 (Paigaldus, Tootmine, Kontor, Ladu). Not editable.
**FR-SET-11** — Custom fields for employees: Phase 2.

#### 7.9.5 Task Settings

**FR-SET-12** — Templates: view, add, edit, deactivate task templates.

---

## 8. Data Models

### 8.1 Project

```typescript
interface Project {
  id: number;                    // auto-increment primary key
  prefix: 'QUOT' | 'P';         // derived from status
  display_id: string;            // e.g., "P-0042"
  name: string;                  // required
  status: ProjectStatus;         // required
  start_date?: Date;
  end_date?: Date;
  description?: string;
  location?: {
    address: string;             // human-readable
    lat: number;
    lng: number;
  };
  people: Employee[];            // assigned employees
  project_manager?: Employee;
  contract_number?: string;
  tags: Tag[];

  client: {
    company_name?: string;
    reg_code?: string;           // Estonian business registry EV-XXXXXXXX
    contact_name?: string;
    phone?: string;              // +372...
    email?: string;
  };

  created_at: Date;
  updated_at: Date;
  created_by: Employee;
}

enum ProjectStatus {
  Hinnapakkumises = 'Hinnapakkumises',
  Ettevalmistuses = 'Ettevalmistuses',
  Töös = 'Töös',
  Lõpetatud = 'Lõpetatud',
}
```

### 8.2 Task

```typescript
interface Task {
  id: number;                    // sequential
  name: string;                  // required
  status: TaskStatus;            // required
  project_id?: number;           // OPTIONAL — tasks can exist without project
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  priority: Priority;
  assignees: Employee[];
  tools: Tool[];
  tags: Tag[];
  start_time?: Date;
  end_time?: Date;
  photos: Photo[];
  template_id?: number;          // which template was used
  created_at: Date;
  updated_at: Date;
}

enum TaskStatus {
  Uus = 'Uus',
  Teha = 'Teha',
  Töös = 'Töös',
  Tehtud = 'Tehtud',
}

enum Priority {
  Madal = 'Madal',
  Keskmine = 'Keskmine',
  Kõrgeim = 'Kõrgeim',
}
```

### 8.3 TimeEntry

```typescript
interface TimeEntry {
  id: number;
  employee_id: number;           // required
  project_id?: number;           // nullable — but requires reason if null
  task_id?: number;              // nullable
  no_project_reason?: string;    // required when project_id is null, min 10 chars
  started_at: Date;              // UTC
  ended_at?: Date;               // UTC; null if timer still running
  duration?: number;             // computed in seconds, never stored as manual input
  pauses: Pause[];
  notes: Comment[];
  is_manual: boolean;            // true if entered by admin, not via timer
  needs_review: boolean;
  is_confirmed: boolean;
  created_at: Date;
  updated_at: Date;
}

interface Pause {
  id: number;
  time_entry_id: number;
  pause_start: Date;
  pause_end?: Date;              // null if pause ongoing
}
```

### 8.4 Employee

```typescript
interface Employee {
  id: number;
  full_name: string;             // required
  photo_url?: string;
  avatar_color: string;          // auto-generated hex, derived from id
  initials: string;              // auto-generated from full_name
  roles: Role[];                 // multiple roles allowed
  group: EmployeeGroup;          // single group
  status: EmployeeStatus;

  // Schedule
  work_schedule?: string;        // e.g., "40 tundi nädalas"
  norm_hours_per_week: number;   // default 40
  project_access: 'ALL' | number[]; // project IDs or ALL

  // Login credentials
  phone?: string;                // +372...
  email?: string;
  language: 'et' | 'ru';        // default 'et'
  time_format: '24h' | '12h';   // default '24h'

  // Sensitive — visible to Administraator only
  hourly_rate?: number;          // EUR/h
  personal_id?: string;          // Estonian isikukood (11 digits)
  birth_date?: Date;
  additional_info?: string;

  created_at: Date;
  updated_at: Date;
  archived_at?: Date;
}

enum EmployeeGroup {
  Paigaldus = 'Paigaldus',
  Tootmine = 'Tootmine',
  Kontor = 'Kontor',
  Ladu = 'Ladu',
}

enum EmployeeStatus {
  Aktiivne = 'Aktiivne',
  Arhiveeritud = 'Arhiveeritud',
}
```

### 8.5 Photo

```typescript
interface Photo {
  id: number;
  file_url: string;              // required — S3 URL
  thumbnail_url: string;
  project_id?: number;
  task_id?: number;
  author_id: number;             // required — Employee
  gps_lat?: number;
  gps_lng?: number;
  gps_verified: boolean;         // true if coords came from device
  taken_at: Date;                // required — from device EXIF or capture time
  uploaded_at: Date;
  file_size_bytes: number;
  original_filename: string;
}
```

### 8.6 Tool

```typescript
interface Tool {
  id: number;
  name: string;                  // required
  code?: string;                 // inventory code
  photo_url?: string;
  current_location_project_id?: number;
  current_location_text?: string; // free text if not assigned to project
  responsible_employee_id?: number;
  status: ToolStatus;
  description?: string;
  manufacturer?: string;         // e.g., "Makita"
  model?: string;                // e.g., "DTD153"
  created_at: Date;
  updated_at: Date;
}

enum ToolStatus {
  Töökorras = 'Töökorras',
  Rikki = 'Rikki',
  Hoolduses = 'Hoolduses',
}
```

### 8.7 InternalDocument & Acknowledgement

```typescript
interface InternalDocument {
  id: number;
  title: string;                  // required
  description?: string;
  category?: string;              // e.g., 'Ohutus', 'Reeglid', 'Koolitus'
  s3_key: string;                 // stored file key in S3
  version: number;                // starts at 1, increments on new file upload
  uploaded_by_id: number;
  requires_ack: boolean;          // default: true
  created_at: Date;
  updated_at: Date;
  archived_at?: Date;
}

interface DocAckAssignment {
  id: number;
  document_id: number;
  employee_id?: number;           // specific employee assignment
  group?: EmployeeGroup;          // OR group assignment
  assigned_by_id: number;
  assigned_at: Date;
  due_date?: Date;
}

interface DocAcknowledgement {
  id: number;
  document_id: number;
  employee_id: number;
  document_version: number;       // version at time of acknowledgement
  acknowledged_at: Date;          // immutable once created
}
```

**Compliance status per employee per document:**
- `pending` — assigned, not yet acknowledged for current version
- `acknowledged` — current version acknowledged
- `overdue` — due_date passed, not acknowledged

### 8.9 Tag

```typescript
interface Tag {
  id: number;
  name: string;
  color: string;                 // hex color
  entity_type: 'project' | 'task';
  created_at: Date;
}
```

### 8.10 TaskTemplate

```typescript
interface TaskTemplate {
  id: number;
  name: string;
  type: 'production' | 'general';
  sort_order: number;            // for production sequence display
  default_group?: EmployeeGroup; // pre-selects assignee group
  is_active: boolean;
  created_at: Date;
}
```

---

## 9. Business Rules

| ID | Rule | Enforcement |
|---|---|---|
| BR-001 | Timer cannot start without project+task, unless employee explicitly selects "no project" and provides a reason (min 10 chars) | Backend validation on POST /time-entries |
| BR-002 | Zero-duration time entries are invalid (ended_at == started_at or duration == 0) | Backend rejects with 400; frontend shows red warning |
| BR-003 | Duration is always computed: (ended_at - started_at) - sum(pause durations). Never accepted as manual input | Computed server-side, not in API request body |
| BR-004 | Project prefix is QUOT- when status = Hinnapakkumises; P- for all other statuses | Computed field, updated on every status change |
| BR-005 | Overtime (ÜT) = total hours logged - norm hours. Can be negative (deficit). Display negatives in red | Computed in timesheet query |
| BR-007 | Saving an employee's phone or email for the first time triggers an automatic invitation | Backend hook on employee update |
| BR-008 | Photos captured via PWA camera must not save to device personal gallery | Frontend: use getUserMedia + canvas, never HTMLInputElement type=file for camera |
| BR-009 | GPS coordinates captured at photo capture time from device geolocation API | Frontend: navigator.geolocation.getCurrentPosition() before/during capture |
| BR-010 | Archived employees are excluded from all active pickers (assignee, people lists) but historical data is preserved | Filter: status = Aktiivne in all list queries |
| BR-011 | One employee can have multiple roles simultaneously | Many-to-many: employee_roles join table |
| BR-012 | All timestamps stored as UTC in database; displayed in Europe/Tallinn timezone | Backend: store UTC; frontend: convert with date-fns-tz |
| BR-013 | Sensitive employee fields (hourly_rate, personal_id, birth_date) are only returned in API responses for Administraator role | Backend field-level authorization in serializer |
| BR-014 | A task template cannot be deleted if tasks using it exist; can only be deactivated | Soft delete with is_active flag |
| BR-015 | Employee project_access = ALL grants access to every project; specific list restricts to those IDs | Middleware check on all project-scoped endpoints |
| BR-016 | An employee can only acknowledge a document assigned to them directly or to their group | Backend validates assignment before recording acknowledgement |
| BR-017 | Uploading a new file to an existing InternalDocument increments version and invalidates all prior acknowledgements — employees must re-acknowledge | Version bump on PATCH with new s3_key; acknowledgement status computed from version match |
| BR-018 | An acknowledgement record is immutable — once created it cannot be deleted or modified | No DELETE or PATCH on DocAcknowledgement; audit trail must remain intact |

---

## 10. Non-Functional Requirements

### 10.1 Performance

- API response time: P95 < 500 ms for all list endpoints.
- Real-time (Praegu view): WebSocket event delivery < 1 s from timer start/stop.
- Photo upload: support files up to 20 MB. Generate thumbnail server-side.
- Timesheet query (all employees, full month): < 3 s.

### 10.2 Security

- JWT tokens signed with HS256 (symmetric — adequate for single-service architecture).
- Refresh tokens delivered via httpOnly, Secure, SameSite=Strict cookie (web/PWA) **and** returned in the response body for native client storage. The `POST /auth/refresh` endpoint accepts the token from either source (cookie takes priority).
- Sensitive employee data (hourly_rate, personal_id) only returned for Administraator.
- All API endpoints authenticated; role-checked per route.
- Photos served via signed S3 URLs (1-hour expiry), not public URLs.
- HTTPS enforced everywhere.

### 10.3 Reliability

- Uptime target: 99.5% monthly.
- Database: daily automated backups with 30-day retention.
- If WebSocket connection drops, client auto-reconnects with exponential backoff (1s, 2s, 4s, max 30s).

### 10.4 Localization

- All UI strings translated in both ET and RU.
- Language stored per employee profile; applied per session.
- Date formats: DD.MM.YYYY (Estonian standard).
- Currency: EUR (€), decimal separator: comma (Estonian standard).
- Phone numbers: +372 prefix default.

### 10.5 Mobile / PWA

- Service Worker for offline task list viewing (read-only when offline).
- Camera access via MediaDevices API — no file picker for photo capture on mobile.
- Push notifications via Web Push (Firebase or self-hosted VAPID).
- App installable on Android and iOS home screen.
- Minimum supported: Android Chrome 90+, iOS Safari 15+.

### 10.6 Accessibility

- WCAG 2.1 AA compliance for all core workflows.
- Keyboard navigable forms.
- Minimum touch target size: 44×44px (mobile).

---

## 11. Acceptance Criteria

### AC-01: Time Tracking — No Unassigned Entries
**Given** an employee tries to start a timer
**When** they have not selected a project
**Then** the system shows a modal requiring project+task selection OR a "no project" reason of at least 10 characters
**And** the timer does not start until the requirement is satisfied

### AC-02: Time Tracking — Zero Duration Blocked
**Given** a timer has started
**When** the employee stops it immediately (same second)
**Then** the system rejects the entry with an error message "Entry duration cannot be zero"
**And** the entry is not saved

### AC-03: Document Acknowledgement — Employee Flow
**Given** an administrator uploads a safety document and assigns it to the "Paigaldus" group
**When** a Paigaldusspetsialist logs in
**Then** a pending badge appears in the sidebar navigation
**And** the document appears in "Minu dokumendid" with status "Ootab kinnitust"
**When** the employee opens and confirms the document
**Then** the status changes to "Kinnitatud" and the badge disappears
**And** the acknowledgement record stores employee_id, document_version, and acknowledged_at

### AC-03b: Document Acknowledgement — Version Invalidation
**Given** an employee has acknowledged version 1 of a safety document
**When** the administrator uploads a new version (version 2)
**Then** the employee's acknowledgement status resets to "Ootab kinnitust"
**And** the pending badge reappears in their sidebar

### AC-03c: Document Acknowledgement — Compliance View
**Given** an administrator opens the compliance matrix for a document
**Then** they see one row per assigned employee
**And** each row shows: name, group, status (Acknowledged / Pending / Overdue), acknowledged_at (if done)

### AC-04: Photo GPS Capture
**Given** a field worker opens the camera in the PWA
**When** they capture a photo
**Then** the system requests GPS coordinates from the device
**And** coordinates are stored with the photo (gps_lat, gps_lng, gps_verified = true)
**And** the photo is NOT saved to the device gallery

### AC-05: Praegu Live Updates
**Given** an employee starts a timer
**When** a manager has the Praegu view open
**Then** the employee's card appears in the "active" section within 1 second
**Without** the manager refreshing the page

### AC-06: Timesheet Export
**Given** an administrator navigates to Tunnitabel for any month
**When** they click "Export Excel"
**Then** an .xlsx file downloads
**And** the file contains one row per employee with TP, NT, ÜT, Kokku computed correctly
**And** negative ÜT values are formatted in red in the Excel file

### AC-07: Bilingual UI
**Given** an employee's profile language is set to Russian (RU)
**When** they log in
**Then** all UI labels, buttons, and system messages display in Russian
**And** switching to ET in profile settings immediately re-renders the UI in Estonian

### AC-08: Employee Invitation on Save
**Given** an administrator creates a new employee record with a phone number
**When** the record is saved
**Then** an SMS invitation is sent to the provided phone number within 60 seconds

### AC-09: Sensitive Data Access Control
**Given** a logged-in user with role Tootmisspetsialist
**When** they call GET /employees/:id
**Then** the response does NOT contain hourly_rate, personal_id, or birth_date

### AC-10: Archived Employee Exclusion
**Given** an employee is archived
**When** any user opens an assignee selector in task or project forms
**Then** the archived employee does not appear in the list
**But** historical assignments and time entries referencing them remain intact

---

## 12. Out of Scope (Phase 2)

The following features are explicitly excluded from Phase 1 and documented in the Phase 2 PRD:

| Feature | Reason deferred |
|---|---|
| Eelarve (Budget, margin, quote generation) | Complex workflow, requires Phase 1 data foundation |
| Clients as standalone CRM entity | Schema-ready in Phase 1, UI in Phase 2 |
| Lisaväljad (Custom fields) for projects and people | Low priority for operations |
| Materials module (Materjalid) | Requires inventory system design |
| Full Tools module (maintenance history, calendar) | Basic tools sufficient for Phase 1 |
| Merit Aktiva accounting integration | Third-party API, separate project |
| Native mobile app (iOS/Android) | PWA sufficient for Phase 1 |
| Chat / Vestlus (internal messaging, project group chats) | Deferred to Phase 2; acknowledgement module covers most critical communication need |

---

*Document maintained by LUMICO development team. Last updated: 2026-04-05.*
