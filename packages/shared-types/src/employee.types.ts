import { EmployeeGroup, EmployeeStatus, Language, TimeFormat } from './enums';

// ─── Read contracts ───────────────────────────────────────────────────────────

/**
 * Trimmed shape for list responses and selectors.
 * Safe for all authenticated callers — no sensitive HR fields.
 */
export interface EmployeeSummary {
  id: number;
  full_name: string;
  initials: string;
  photo_url: string | null;
  avatar_color: string;
  group: EmployeeGroup;
  status: EmployeeStatus;
  roles: string[];
}

/**
 * Full detail shape returned by GET /employees/:id.
 * Extends EmployeeSummary with safe profile/contact fields.
 *
 * Sensitive HR fields (hourly_rate, personal_id, birth_date) are optional:
 * they are populated only when the requester has the Administraator role (BR-013).
 * Non-admin callers receive undefined for these fields — never the raw value.
 */
export interface EmployeeDetail extends EmployeeSummary {
  phone: string | null;
  email: string | null;
  language: Language;
  time_format: TimeFormat;
  work_schedule: string | null;
  norm_hours_per_week: number;
  project_access_all: boolean;
  additional_info: string | null;
  created_at: string;   // ISO-8601 UTC
  updated_at: string;   // ISO-8601 UTC

  // BR-013: Administraator-only — undefined for non-admin callers
  hourly_rate?: string | null;    // Prisma Decimal serialised as string
  personal_id?: string | null;
  birth_date?: string | null;     // ISO date "YYYY-MM-DD"
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

/**
 * PATCH /employees/me — fields an employee can update about themselves.
 * Photo upload is a separate presigned-URL flow and is NOT included here.
 */
export interface UpdateOwnProfileDto {
  full_name?: string;
  language?: Language;
  time_format?: TimeFormat;
}

// ─── Admin DTOs (scoped to future admin-employee management tasks) ────────────

export interface CreateEmployeeDto {
  full_name: string;
  group: EmployeeGroup;
  phone?: string;
  email?: string;
  password?: string;
  work_schedule?: string;
  norm_hours_per_week?: number;
  project_access_all?: boolean;
  language?: Language;
  time_format?: TimeFormat;
  hourly_rate?: string;
  personal_id?: string;
  birth_date?: string;
  additional_info?: string;
  role_ids?: number[];
}

export interface UpdateEmployeeDto {
  full_name?: string;
  group?: EmployeeGroup;
  /** Admin can change employee status (e.g. back to Aktiivne after archival review). */
  status?: EmployeeStatus;
  phone?: string;
  email?: string;
  work_schedule?: string;
  norm_hours_per_week?: number;
  project_access_all?: boolean;
  language?: Language;
  time_format?: TimeFormat;
  hourly_rate?: string;
  personal_id?: string;
  birth_date?: string;
  additional_info?: string;
  /**
   * Full replacement of role assignments. Omit to leave roles unchanged.
   * Pass empty array to remove all roles.
   */
  role_ids?: number[];
}
