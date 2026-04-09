'use client';

import type { StartTimeEntryDto } from '@lumicore/shared-types';
import { type FormEvent, useMemo, useState } from 'react';

import { useProjects } from '@/hooks/use-projects';
import { useStartTimeEntry } from '@/hooks/use-start-time-entry';
import { useTasks } from '@/hooks/use-tasks';

type TimeEntryFormState = {
  project_id: string;
  task_id: string;
  no_project_reason: string;
  is_manual: boolean;
  started_at: string;
  ended_at: string;
};

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50';

const emptyFormState: TimeEntryFormState = {
  project_id: '',
  task_id: '',
  no_project_reason: '',
  is_manual: false,
  started_at: '',
  ended_at: '',
};

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

function buildPayload(state: TimeEntryFormState): StartTimeEntryDto {
  return {
    project_id: toNullableNumber(state.project_id),
    task_id: toNullableNumber(state.task_id),
    no_project_reason: toNullableString(state.no_project_reason),
    is_manual: state.is_manual ? true : undefined,
    started_at: state.is_manual ? toIsoDateTime(state.started_at) : undefined,
    ended_at: state.is_manual ? toIsoDateTime(state.ended_at) : undefined,
  };
}

export function TimeEntryForm(): JSX.Element {
  const [form, setForm] = useState<TimeEntryFormState>(emptyFormState);
  const [localError, setLocalError] = useState<string | null>(null);
  const { isLoading, error, startTimeEntry } = useStartTimeEntry();
  const { data: projectsData, isLoading: isProjectsLoading } = useProjects({ limit: 100 });

  const selectedProjectId = useMemo(() => toNullableNumber(form.project_id), [form.project_id]);
  const { data: tasksData, isLoading: isTasksLoading } = useTasks(
    selectedProjectId ? { project_id: selectedProjectId, limit: 100 } : undefined,
  );

  const projects = projectsData?.data ?? [];
  const tasks = tasksData?.data ?? [];
  const disabled = isLoading;

  function updateField<K extends keyof TimeEntryFormState>(
    key: K,
    value: TimeEntryFormState[K],
  ): void {
    setForm((current) => {
      if (key === 'project_id' && current.project_id !== value) {
        return { ...current, project_id: value as string, task_id: '' };
      }

      return { ...current, [key]: value };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLocalError(null);

    if (!form.project_id && form.no_project_reason.trim().length < 10) {
      setLocalError('Add a reason with at least 10 characters when no project is selected.');
      return;
    }

    if (form.is_manual) {
      if (!form.started_at || !form.ended_at) {
        setLocalError('Manual entries need both start and end time.');
        return;
      }

      const startedAt = new Date(form.started_at);
      const endedAt = new Date(form.ended_at);
      if (
        Number.isNaN(startedAt.getTime()) ||
        Number.isNaN(endedAt.getTime()) ||
        startedAt >= endedAt
      ) {
        setLocalError('Manual entry end time must be after start time.');
        return;
      }
    }

    const created = await startTimeEntry(buildPayload(form));
    if (created) {
      setForm(emptyFormState);
    }
  }

  return (
    <section className="panel p-6 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
            Start tracking
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">
            Create a live or manual entry
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-text-secondary">
          Phase 1 stays HTTP-driven. Start a live timer, or add a manual entry when you already
          know the start and end times.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <label className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-surface-1 px-4 py-4">
          <input
            type="checkbox"
            checked={form.is_manual}
            onChange={(event) => updateField('is_manual', event.target.checked)}
            disabled={disabled}
            className="mt-1 h-4 w-4 rounded border-border-subtle text-accent-600 focus:ring-accent-500"
          />
          <span>
            <span className="block text-sm font-semibold text-text-primary">
              Create a manual entry instead of starting a live timer
            </span>
            <span className="mt-1 block text-sm leading-6 text-text-secondary">
              Use this when you already know the exact start and end times.
            </span>
          </span>
        </label>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="time-entry-project">
              Project
            </label>
            <select
              id="time-entry-project"
              value={form.project_id}
              onChange={(event) => updateField('project_id', event.target.value)}
              disabled={disabled || isProjectsLoading}
              className={inputCls}
            >
              <option value="">
                {isProjectsLoading ? 'Loading projects...' : 'No project selected'}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={String(project.id)}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="time-entry-task">
              Task
            </label>
            <select
              id="time-entry-task"
              value={form.task_id}
              onChange={(event) => updateField('task_id', event.target.value)}
              disabled={disabled || !selectedProjectId || isTasksLoading}
              className={inputCls}
            >
              <option value="">
                {!selectedProjectId
                  ? 'Select a project first'
                  : isTasksLoading
                    ? 'Loading tasks...'
                    : 'No task selected'}
              </option>
              {tasks.map((task) => (
                <option key={task.id} value={String(task.id)}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label
              className="text-sm font-semibold text-text-primary"
              htmlFor="time-entry-no-project-reason"
            >
              Reason when no project is selected
            </label>
            <textarea
              id="time-entry-no-project-reason"
              value={form.no_project_reason}
              onChange={(event) => updateField('no_project_reason', event.target.value)}
              disabled={disabled}
              className={`${inputCls} min-h-28 resize-y`}
              placeholder="Explain what you are doing if this time is not linked to a project."
            />
          </div>

          {form.is_manual ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-primary" htmlFor="time-entry-started-at">
                  Start time
                </label>
                <input
                  id="time-entry-started-at"
                  type="datetime-local"
                  value={form.started_at}
                  onChange={(event) => updateField('started_at', event.target.value)}
                  disabled={disabled}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-primary" htmlFor="time-entry-ended-at">
                  End time
                </label>
                <input
                  id="time-entry-ended-at"
                  type="datetime-local"
                  value={form.ended_at}
                  onChange={(event) => updateField('ended_at', event.target.value)}
                  disabled={disabled}
                  className={inputCls}
                />
              </div>
            </>
          ) : null}
        </div>

        {(localError || error) && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {localError ?? error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center justify-center rounded-2xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? form.is_manual
                ? 'Creating...'
                : 'Starting...'
              : form.is_manual
                ? 'Create manual entry'
                : 'Start timer'}
          </button>
          <p className="text-sm leading-6 text-text-muted">
            Manual entries are optional in Phase 1, but the backend contract is already supported.
          </p>
        </div>
      </form>
    </section>
  );
}
