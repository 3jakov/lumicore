import { ProjectStatus } from './enums';

// ─── Shared contract: what the frontend receives ──────────────────────────────

/**
 * Lightweight projection returned by GET /projects (list).
 * All fields always present — display_id computed server-side per BR-004.
 */
export interface ProjectSummary {
  id: number;
  display_id: string;       // BR-004: "QUOT-{id}" | "P-{id}"
  name: string;
  status: ProjectStatus;
  created_at: string;       // ISO-8601 UTC
}

/**
 * Full project object returned by GET /projects/:id.
 * Extends ProjectSummary with all detail fields.
 * Optional fields mirror nullable Prisma columns.
 */
export interface ProjectDetail extends ProjectSummary {
  description: string | null;
  start_date: string | null;   // ISO-8601 date ("YYYY-MM-DD")
  end_date: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  contract_number: string | null;
  project_manager_id: number | null;
  client_company_name: string | null;
  client_reg_code: string | null;
  client_contact_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  updated_at: string;          // ISO-8601 UTC
}

// ─── Request DTOs (consumed by frontend forms, defined here for type safety) ──

export interface CreateProjectDto {
  name: string;
  status?: ProjectStatus;
  // Nullable fields: explicit null clears the value; undefined means omit on create.
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  contract_number?: string | null;
  project_manager_id?: number | null;
  client_company_name?: string | null;
  client_reg_code?: string | null;
  client_contact_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
}

/**
 * On update: undefined = don't touch; null = clear; string/number = set.
 * This maps directly to Prisma's behaviour — undefined values are ignored in update data.
 */
export interface UpdateProjectDto extends Partial<CreateProjectDto> {}
