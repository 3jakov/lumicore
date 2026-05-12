import { EmployeeGroup, Priority, TaskStatus, TemplateType } from './enums';

// ─── Read contracts ───────────────────────────────────────────────────────────

/**
 * Lightweight projection for list/kanban views.
 * Uses assignee_ids only — no nested employee objects at this baseline stage.
 */
export interface TaskSummary {
  id: number;
  name: string;
  status: TaskStatus;
  priority: Priority;
  project_id: number | null;
  template_id: number | null;
  start_time: string | null;   // ISO-8601 UTC
  end_time: string | null;     // ISO-8601 UTC
  created_at: string;          // ISO-8601 UTC
  assignee_ids: number[];
}

/**
 * Full task object returned by GET /tasks/:id and POST/PATCH /tasks/:id.
 * Extends TaskSummary with location and audit fields.
 */
export interface TaskDetail extends TaskSummary {
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  updated_at: string;           // ISO-8601 UTC
  archived_at: string | null;   // ISO-8601 UTC — useful for audit displays
}

/**
 * Lightweight read shape for the templates picker.
 * Returned by GET /tasks/templates.
 */
export interface TaskTemplateSummary {
  id: number;
  name: string;
  type: TemplateType;
  sort_order: number;
  default_group: EmployeeGroup | null;
  is_active: boolean;
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateTaskDto {
  name: string;
  status?: TaskStatus;
  priority?: Priority;
  // Nullable: undefined = omit on create; null = explicitly clear (no-op for create)
  project_id?: number | null;
  template_id?: number | null;
  start_time?: string | null;   // ISO-8601 UTC string
  end_time?: string | null;     // ISO-8601 UTC string
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  /** When provided, TaskAssignee records are created for each ID in the same transaction. */
  assignee_ids?: number[];
}

/**
 * Partial update DTO.
 * undefined = don't touch; null = clear the field; value = set the field.
 * assignee_ids:
 *   undefined = leave assignees untouched
 *   []        = remove all assignees
 *   [1, 2]    = replace with exactly these employees
 */
export interface UpdateTaskDto extends Partial<CreateTaskDto> {}
