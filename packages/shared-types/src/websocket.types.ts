export interface TimerStartedEvent {
  employee_id: number;
  project_id: number | null;
  project_name: string | null;
  task_id: number | null;
  task_name: string | null;
  started_at: string; // ISO 8601
}

export interface TimerStoppedEvent {
  employee_id: number;
  time_entry_id: number;
}

export interface TimerPausedEvent {
  employee_id: number;
  time_entry_id: number;
}

export interface TimerResumedEvent {
  employee_id: number;
  time_entry_id: number;
}
