import { ToolStatus } from './enums';

// ─── Shared contract: what the frontend receives ──────────────────────────────

/**
 * Lightweight projection returned by GET /tools (list).
 * Does not include photo, description, or maintenance detail fields.
 */
export interface ToolSummary {
  id: number;
  name: string;
  code: string | null;
  status: ToolStatus;
  current_location_project_id: number | null;
  current_location_text: string | null;
  responsible_employee_id: number | null;
  created_at: string; // ISO-8601 UTC
}

/**
 * Full tool object returned by GET /tools/:id, POST /tools, PATCH /tools/:id.
 * Extends ToolSummary with all detail fields.
 */
export interface ToolDetail extends ToolSummary {
  photo_s3_key: string | null;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  updated_at: string;   // ISO-8601 UTC
  archived_at: string | null; // ISO-8601 UTC; null when active
}

// ─── Request DTOs (consumed by frontend forms, defined here for type safety) ──

export interface CreateToolDto {
  name: string;
  // Nullable fields: explicit null clears the value; undefined means omit on create.
  code?: string | null;
  photo_s3_key?: string | null;
  current_location_project_id?: number | null;
  current_location_text?: string | null;
  responsible_employee_id?: number | null;
  status?: ToolStatus;
  description?: string | null;
  manufacturer?: string | null;
  model?: string | null;
}

/**
 * On update: undefined = don't touch; null = clear; value = set.
 * Maps directly to Prisma behaviour — undefined values are ignored in update data.
 */
export interface UpdateToolDto extends Partial<CreateToolDto> {}
