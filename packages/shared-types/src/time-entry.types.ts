// Time Tracking shared contracts — consumed by both NestJS API and Next.js frontend
// Duration is NEVER stored. All duration fields are computed from timestamps + pauses (BR-003).

// ─── Supporting types ─────────────────────────────────────────────────────────

/** Represents a single pause window within a time entry */
export interface PauseSummary {
  id: number;
  pause_start: string; // ISO 8601 UTC
  pause_end: string | null; // null = currently paused
}

// ─── Core response shapes ─────────────────────────────────────────────────────

/**
 * TimeEntrySummary — returned in list responses.
 * Duration fields are computed server-side (BR-003).
 */
export interface TimeEntrySummary {
  id: number;
  employee_id: number;
  project_id: number | null;
  task_id: number | null;
  no_project_reason: string | null;
  started_at: string; // ISO 8601 UTC
  ended_at: string | null; // null = timer still running
  is_manual: boolean;
  needs_review: boolean;
  is_confirmed: boolean;
  /** Duration in seconds (null if timer still running / not yet stopped). Computed, not stored. */
  duration_seconds: number | null;
  /** Total pause duration in seconds. Computed, not stored. */
  pause_duration_seconds: number;
  /** Whether entry is currently paused (open Pause row exists). */
  is_paused: boolean;
  created_at: string;
}

/**
 * TimeEntryDetail — returned for single-entry responses (stop/pause/resume actions).
 * Includes the full pause list for timeline accuracy.
 */
export interface TimeEntryDetail extends TimeEntrySummary {
  pauses: PauseSummary[];
  updated_at: string;
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

/**
 * Start a new timer or create a manual entry.
 * BR-001: project_id null requires no_project_reason (min 10 chars).
 * BR-002: is_manual=true requires started_at < ended_at.
 * BR-003: duration is never accepted in the request body.
 */
export interface StartTimeEntryDto {
  /** Required unless no_project_reason is provided. */
  project_id?: number | null;
  /** Optional — must belong to an active project when provided. */
  task_id?: number | null;
  /**
   * Required when project_id is null.
   * Minimum 10 characters (BR-001).
   */
  no_project_reason?: string | null;
  /**
   * When true: manual entry — started_at and ended_at must both be provided.
   * When false (default): timer start — only started_at is used; ended_at is ignored.
   */
  is_manual?: boolean;
  /**
   * Start timestamp. ISO 8601.
   * Required for manual entries. Defaults to server time for timer starts if omitted.
   */
  started_at?: string;
  /**
   * End timestamp. ISO 8601.
   * Required for manual entries. Must be after started_at (BR-002).
   * Ignored for timer starts.
   */
  ended_at?: string;
}

// ─── Action response shapes ───────────────────────────────────────────────────

/**
 * Returned after POST /time-entries/:id/pause.
 * Contains the full updated entry (with open pause included).
 */
export type PauseTimeEntryResponse = TimeEntryDetail;

/**
 * Returned after POST /time-entries/:id/resume.
 * Contains the full updated entry (pause closed, running again).
 */
export type ResumeTimeEntryResponse = TimeEntryDetail;

/**
 * Returned after POST /time-entries/:id/stop.
 * Contains the full final entry with ended_at and computed duration.
 */
export type StopTimeEntryResponse = TimeEntryDetail;

// ─── Timesheet types ──────────────────────────────────────────────────────────

/**
 * Daily bucket inside a timesheet summary.
 */
export interface TimesheetDay {
  /** Calendar date in YYYY-MM-DD (local Tallinn timezone). */
  date: string;
  /** Total tracked seconds for this day (pauses excluded). */
  tracked_seconds: number;
  /** Number of time entries on this day. */
  entry_count: number;
}

/**
 * Self timesheet summary for a date range.
 * Aggregates the authenticated employee's entries only.
 * All durations computed from timestamps + pauses (BR-003).
 */
export interface TimesheetSummary {
  employee_id: number;
  /** Inclusive range start, YYYY-MM-DD */
  date_from: string;
  /** Inclusive range end, YYYY-MM-DD */
  date_to: string;
  /** Total tracked seconds across the range (pauses excluded). */
  total_tracked_seconds: number;
  /** Daily breakdown for frontend grid rendering. */
  days: TimesheetDay[];
}
