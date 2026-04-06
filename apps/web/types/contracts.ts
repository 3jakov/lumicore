import type { EmployeeGroup, Priority, ProjectStatus, TaskStatus } from '@lumicore/shared-types';

export type ProjectSummary = {
  id: number;
  display_id?: string;
  name: string;
  status: ProjectStatus;
};

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

export type EmployeeSummary = {
  id: number;
  full_name: string;
  group: EmployeeGroup;
};
