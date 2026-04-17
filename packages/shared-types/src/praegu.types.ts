export interface ActiveTimerEntry {
  employee_id: number;
  employee_name: string;
  time_entry_id: number;
  project_id: number | null;
  project_name: string | null;
  task_id: number | null;
  task_name: string | null;
  started_at: string; // ISO 8601
  is_paused: boolean;
  pause_duration_seconds: number;
}
