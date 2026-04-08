'use client';

import { Priority, TaskStatus, type CreateTaskDto, type TaskTemplateSummary } from '@lumicore/shared-types';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useEmployees } from '@/hooks/use-employees';
import { useCreateTask } from '@/hooks/use-create-task';
import { useProjects } from '@/hooks/use-projects';
import { useTaskTemplates } from '@/hooks/use-task-templates';

type TaskFormState = {
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

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

const textAreaCls = `${inputCls} min-h-28 resize-y`;

const initialFormState: TaskFormState = {
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

function toNullableString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toNullableNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNullableDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function buildPayload(form: TaskFormState): CreateTaskDto {
  return {
    name: form.name.trim(),
    status: form.status,
    priority: form.priority,
    project_id: toNullableNumber(form.project_id),
    template_id: toNullableNumber(form.template_id),
    start_time: toNullableDateTime(form.start_time),
    end_time: toNullableDateTime(form.end_time),
    location_address: toNullableString(form.location_address),
    location_lat: toNullableNumber(form.location_lat),
    location_lng: toNullableNumber(form.location_lng),
    assignee_ids: form.assignee_ids.length > 0 ? form.assignee_ids : undefined,
  };
}

function sortTemplates(templates: TaskTemplateSummary[]): TaskTemplateSummary[] {
  return [...templates].sort((a, b) => a.sort_order - b.sort_order);
}

export function TaskCreateForm(): JSX.Element {
  const { isLoading, error, createTask } = useCreateTask();
  const { data: templatesData, isLoading: isTemplatesLoading, isError: isTemplatesError } =
    useTaskTemplates();
  const { data: projectsData, isLoading: isProjectsLoading } = useProjects();
  const { data: employeesData, isLoading: isEmployeesLoading } = useEmployees();

  const [form, setForm] = useState<TaskFormState>(initialFormState);
  const [localError, setLocalError] = useState<string | null>(null);

  const trimmedName = form.name.trim();
  const canSubmit = trimmedName.length > 0 && !isLoading;
  const templates = useMemo(() => sortTemplates(templatesData ?? []), [templatesData]);
  const projects = projectsData?.data ?? [];
  const employees = employeesData?.data ?? [];

  function updateField<K extends keyof TaskFormState>(key: K, value: TaskFormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError(null);
  }

  function handleAssigneeChange(selectedOptions: HTMLCollectionOf<HTMLOptionElement>): void {
    const assigneeIds = Array.from(selectedOptions)
      .map((option) => Number(option.value))
      .filter((value) => Number.isFinite(value));
    updateField('assignee_ids', assigneeIds);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!trimmedName) {
      setLocalError('Task name is required.');
      return;
    }

    await createTask(buildPayload(form));
  }

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">Tasks</p>
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">Create task</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
        Capture the baseline task record now. Edits, archives, and richer workflow context can
        layer on in the next task iteration.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-semibold text-text-primary" htmlFor="task-name">
              Task name
            </label>
            <input
              id="task-name"
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              disabled={isLoading}
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
              onChange={(event) => updateField('status', event.target.value as TaskStatus)}
              disabled={isLoading}
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
              onChange={(event) => updateField('priority', event.target.value as Priority)}
              disabled={isLoading}
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
              onChange={(event) => updateField('project_id', event.target.value)}
              disabled={isLoading || isProjectsLoading}
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
              onChange={(event) => updateField('template_id', event.target.value)}
              disabled={isLoading || isTemplatesLoading || isTemplatesError}
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
              onChange={(event) => updateField('start_time', event.target.value)}
              disabled={isLoading}
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
              onChange={(event) => updateField('end_time', event.target.value)}
              disabled={isLoading}
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
              onChange={(event) => updateField('location_address', event.target.value)}
              disabled={isLoading}
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
              onChange={(event) => updateField('location_lat', event.target.value)}
              disabled={isLoading}
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
              onChange={(event) => updateField('location_lng', event.target.value)}
              disabled={isLoading}
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
              disabled={isLoading || isEmployeesLoading}
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

        {localError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {localError}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/tasks"
            className="text-sm font-semibold text-text-secondary transition hover:text-text-primary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-2xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create task'}
          </button>
        </div>
      </form>
    </section>
  );
}
