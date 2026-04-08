'use client';

import {
  Priority,
  TaskStatus,
  type CreateTaskDto,
  type TaskDetail,
  type TaskTemplateSummary,
  type UpdateTaskDto,
} from '@lumicore/shared-types';

import { useEmployees } from '@/hooks/use-employees';
import { useProjects } from '@/hooks/use-projects';
import { useTaskTemplates } from '@/hooks/use-task-templates';

export type TaskFormState = {
  name: string;
  status: TaskStatus;
  priority: Priority;
  project_id: string;
  template_id: string;
  start_time: string;
  end_time: string;
  location_address: string;
  location_lat: string;
  location_lng: string;
  assignee_ids: number[];
};

type ComparableTaskState = {
  name: string;
  status: TaskStatus;
  priority: Priority;
  project_id: number | null;
  template_id: number | null;
  start_time: string | null;
  end_time: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  assignee_ids: number[];
};

type TaskFormFieldsProps = Readonly<{
  disabled: boolean;
  form: TaskFormState;
  onFieldChange: <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => void;
}>;

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

const textAreaCls = `${inputCls} min-h-28 resize-y`;

export const emptyTaskFormState: TaskFormState = {
  name: '',
  status: TaskStatus.Uus,
  priority: Priority.Keskmine,
  project_id: '',
  template_id: '',
  start_time: '',
  end_time: '',
  location_address: '',
  location_lat: '',
  location_lng: '',
  assignee_ids: [],
};

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableDateTime(value: string): string | null {
  return value ? value : null;
}

function toIsoDateTime(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toInputDateTime(value: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeAssigneeIds(ids: number[]): number[] {
  return [...ids].sort((a, b) => a - b);
}

function areAssigneeIdsEqual(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;

  return left.every((value, index) => value === right[index]);
}

function sortTemplates(templates: TaskTemplateSummary[]): TaskTemplateSummary[] {
  return [...templates].sort((a, b) => a.sort_order - b.sort_order);
}

function toComparableTaskState(state: TaskFormState): ComparableTaskState {
  return {
    name: state.name.trim(),
    status: state.status,
    priority: state.priority,
    project_id: toNullableNumber(state.project_id),
    template_id: toNullableNumber(state.template_id),
    start_time: toNullableDateTime(state.start_time),
    end_time: toNullableDateTime(state.end_time),
    location_address: toNullableString(state.location_address),
    location_lat: toNullableNumber(state.location_lat),
    location_lng: toNullableNumber(state.location_lng),
    assignee_ids: normalizeAssigneeIds(state.assignee_ids),
  };
}

export function normalizeTaskFormState(
  task: Pick<
    TaskDetail,
    | 'name'
    | 'status'
    | 'priority'
    | 'project_id'
    | 'template_id'
    | 'start_time'
    | 'end_time'
    | 'location_address'
    | 'location_lat'
    | 'location_lng'
    | 'assignee_ids'
  >,
): TaskFormState {
  return {
    name: task.name,
    status: task.status,
    priority: task.priority,
    project_id: task.project_id !== null ? String(task.project_id) : '',
    template_id: task.template_id !== null ? String(task.template_id) : '',
    start_time: toInputDateTime(task.start_time),
    end_time: toInputDateTime(task.end_time),
    location_address: task.location_address ?? '',
    location_lat: task.location_lat !== null ? String(task.location_lat) : '',
    location_lng: task.location_lng !== null ? String(task.location_lng) : '',
    assignee_ids: normalizeAssigneeIds(task.assignee_ids),
  };
}

export function buildCreateTaskPayload(state: TaskFormState): CreateTaskDto {
  const comparable = toComparableTaskState(state);

  return {
    name: comparable.name,
    status: comparable.status,
    priority: comparable.priority,
    project_id: comparable.project_id ?? undefined,
    template_id: comparable.template_id ?? undefined,
    start_time: toIsoDateTime(comparable.start_time) ?? undefined,
    end_time: toIsoDateTime(comparable.end_time) ?? undefined,
    location_address: comparable.location_address ?? undefined,
    location_lat: comparable.location_lat ?? undefined,
    location_lng: comparable.location_lng ?? undefined,
    assignee_ids: comparable.assignee_ids.length > 0 ? comparable.assignee_ids : undefined,
  };
}

export function buildUpdateTaskPayload(
  initialState: TaskFormState,
  currentState: TaskFormState,
): UpdateTaskDto {
  const initialComparable = toComparableTaskState(initialState);
  const currentComparable = toComparableTaskState(currentState);
  const payload: UpdateTaskDto = {};

  if (initialComparable.name !== currentComparable.name) {
    payload.name = currentComparable.name;
  }
  if (initialComparable.status !== currentComparable.status) {
    payload.status = currentComparable.status;
  }
  if (initialComparable.priority !== currentComparable.priority) {
    payload.priority = currentComparable.priority;
  }
  if (initialComparable.project_id !== currentComparable.project_id) {
    payload.project_id = currentComparable.project_id;
  }
  if (initialComparable.template_id !== currentComparable.template_id) {
    payload.template_id = currentComparable.template_id;
  }
  if (initialComparable.start_time !== currentComparable.start_time) {
    payload.start_time = toIsoDateTime(currentComparable.start_time);
  }
  if (initialComparable.end_time !== currentComparable.end_time) {
    payload.end_time = toIsoDateTime(currentComparable.end_time);
  }
  if (initialComparable.location_address !== currentComparable.location_address) {
    payload.location_address = currentComparable.location_address;
  }
  if (initialComparable.location_lat !== currentComparable.location_lat) {
    payload.location_lat = currentComparable.location_lat;
  }
  if (initialComparable.location_lng !== currentComparable.location_lng) {
    payload.location_lng = currentComparable.location_lng;
  }
  if (!areAssigneeIdsEqual(initialComparable.assignee_ids, currentComparable.assignee_ids)) {
    payload.assignee_ids = currentComparable.assignee_ids;
  }

  return payload;
}

export function hasTaskFormChanges(
  initialState: TaskFormState,
  currentState: TaskFormState,
): boolean {
  const initialComparable = toComparableTaskState(initialState);
  const currentComparable = toComparableTaskState(currentState);

  return (
    initialComparable.name !== currentComparable.name ||
    initialComparable.status !== currentComparable.status ||
    initialComparable.priority !== currentComparable.priority ||
    initialComparable.project_id !== currentComparable.project_id ||
    initialComparable.template_id !== currentComparable.template_id ||
    initialComparable.start_time !== currentComparable.start_time ||
    initialComparable.end_time !== currentComparable.end_time ||
    initialComparable.location_address !== currentComparable.location_address ||
    initialComparable.location_lat !== currentComparable.location_lat ||
    initialComparable.location_lng !== currentComparable.location_lng ||
    !areAssigneeIdsEqual(initialComparable.assignee_ids, currentComparable.assignee_ids)
  );
}

export function TaskFormFields({
  disabled,
  form,
  onFieldChange,
}: TaskFormFieldsProps): JSX.Element {
  const { data: templatesData, isLoading: isTemplatesLoading, isError: isTemplatesError } =
    useTaskTemplates();
  const { data: projectsData, isLoading: isProjectsLoading } = useProjects();
  const { data: employeesData, isLoading: isEmployeesLoading, isError: isEmployeesError } =
    useEmployees();

  const templates = sortTemplates(templatesData ?? []);
  const projects = projectsData?.data ?? [];
  const employees = employeesData?.data ?? [];

  function handleAssigneeChange(selectedOptions: HTMLCollectionOf<HTMLOptionElement>): void {
    const assigneeIds = Array.from(selectedOptions)
      .map((option) => Number(option.value))
      .filter((value) => Number.isFinite(value));

    onFieldChange('assignee_ids', assigneeIds);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-name">
          Task name
        </label>
        <input
          id="task-name"
          type="text"
          value={form.name}
          onChange={(event) => onFieldChange('name', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Example: Load van for Tartu site"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-status">
          Status
        </label>
        <select
          id="task-status"
          value={form.status}
          onChange={(event) => onFieldChange('status', event.target.value as TaskStatus)}
          disabled={disabled}
          className={inputCls}
        >
          {Object.values(TaskStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-priority">
          Priority
        </label>
        <select
          id="task-priority"
          value={form.priority}
          onChange={(event) => onFieldChange('priority', event.target.value as Priority)}
          disabled={disabled}
          className={inputCls}
        >
          {Object.values(Priority).map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-project">
          Project
        </label>
        <select
          id="task-project"
          value={form.project_id}
          onChange={(event) => onFieldChange('project_id', event.target.value)}
          disabled={disabled || isProjectsLoading}
          className={inputCls}
        >
          <option value="">{isProjectsLoading ? 'Loading projects...' : 'No project linked'}</option>
          {projects.map((project) => (
            <option key={project.id} value={String(project.id)}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-template">
          Template
        </label>
        <select
          id="task-template"
          value={form.template_id}
          onChange={(event) => onFieldChange('template_id', event.target.value)}
          disabled={disabled || isTemplatesLoading || isTemplatesError}
          className={inputCls}
        >
          <option value="">
            {isTemplatesLoading
              ? 'Loading templates...'
              : isTemplatesError
                ? 'Templates unavailable'
                : 'No template selected'}
          </option>
          {templates.map((template) => (
            <option key={template.id} value={String(template.id)}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-start-time">
          Start time
        </label>
        <input
          id="task-start-time"
          type="datetime-local"
          value={form.start_time}
          onChange={(event) => onFieldChange('start_time', event.target.value)}
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-end-time">
          End time
        </label>
        <input
          id="task-end-time"
          type="datetime-local"
          value={form.end_time}
          onChange={(event) => onFieldChange('end_time', event.target.value)}
          disabled={disabled}
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-location-address">
          Location address
        </label>
        <textarea
          id="task-location-address"
          value={form.location_address}
          onChange={(event) => onFieldChange('location_address', event.target.value)}
          disabled={disabled}
          className={textAreaCls}
          placeholder="Optional task location"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-location-lat">
          Latitude
        </label>
        <input
          id="task-location-lat"
          type="number"
          value={form.location_lat}
          onChange={(event) => onFieldChange('location_lat', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional latitude"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-location-lng">
          Longitude
        </label>
        <input
          id="task-location-lng"
          type="number"
          value={form.location_lng}
          onChange={(event) => onFieldChange('location_lng', event.target.value)}
          disabled={disabled}
          className={inputCls}
          placeholder="Optional longitude"
        />
      </div>

      <div className="space-y-1.5 lg:col-span-2">
        <label className="text-sm font-semibold text-text-primary" htmlFor="task-assignees">
          Assignees
        </label>
        <select
          id="task-assignees"
          multiple
          value={form.assignee_ids.map(String)}
          onChange={(event) => handleAssigneeChange(event.target.selectedOptions)}
          disabled={disabled || isEmployeesLoading || isEmployeesError}
          className={`${inputCls} min-h-40`}
        >
          {employees.map((employee) => (
            <option key={employee.id} value={String(employee.id)}>
              {employee.full_name}
            </option>
          ))}
        </select>
        <p className="text-xs leading-5 text-text-muted">
          Leave empty for no assignees. Multi-select is supported for the baseline flow.
        </p>
      </div>
    </div>
  );
}
