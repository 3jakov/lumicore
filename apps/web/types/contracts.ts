import type { Priority, TaskStatus } from '@lumicore/shared-types';

// ProjectSummary and ProjectDetail live in @lumicore/shared-types — import from there.
// EmployeeSummary lives in @lumicore/shared-types — import from there.

export type TaskSummary = {
  id: number;
  name: string;
  status: TaskStatus;
  priority?: Priority;
  project_id?: number;
};

export type TimeEntrySummary = {
  id: number;
  employee_id: number;
  project_id?: number;
  task_id?: number;
  started_at: string;
  ended_at?: string;
};
