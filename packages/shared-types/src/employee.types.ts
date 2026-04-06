import { EmployeeGroup, EmployeeStatus, Language, TimeFormat } from './enums';

// ─── Core Employee ────────────────────────────────────────────────────────────

/** Full employee record — sensitive fields present only for Administraator */
export interface Employee {
  id: number;
  full_name: string;
  initials: string;
  photo_url: string | null;
  avatar_color: string;
  group: EmployeeGroup;
  status: EmployeeStatus;
  work_schedule: string | null;
  norm_hours_per_week: number;
  project_access_all: boolean;
  phone: string | null;
  email: string | null;
  language: Language;
  time_format: TimeFormat;
  additional_info: string | null;
  created_at: string;   // ISO 8601 UTC
  archived_at: string | null;
  roles: string[];      // role names

  // Administraator-only fields (stripped for non-admins)
  hourly_rate?: string | null;    // Decimal as string to avoid float loss
  personal_id?: string | null;
  birth_date?: string | null;     // ISO date string YYYY-MM-DD
}

/** Trimmed shape for list responses (non-admin callers) */
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

// ─── DTOs ─────────────────────────────────────────────────────────────────────

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
  role_ids?: number[];
}

/** PATCH /employees/me — only fields an employee can change about themselves */
export interface UpdateOwnProfileDto {
  language?: Language;
  time_format?: TimeFormat;
  full_name?: string;
  photo_url?: string;
}
