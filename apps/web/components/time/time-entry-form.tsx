'use client';

import type { StartTimeEntryDto } from '@lumicore/shared-types';
import { type FormEvent, useMemo, useState } from 'react';

import { useProjects } from '@/hooks/use-projects';
import { useStartTimeEntry } from '@/hooks/use-start-time-entry';
import { useTasks } from '@/hooks/use-tasks';
import { useTranslation } from '@/hooks/use-translation';

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
  const { t } = useTranslation();
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
      setLocalError(t('time.form.noProjectReasonError'));
      return;
    }

    if (form.is_manual) {
      if (!form.started_at || !form.ended_at) {
        setLocalError(t('time.form.manualTimeRequiredError'));
        return;
      }

      const startedAt = new Date(form.started_at);
      const endedAt = new Date(form.ended_at);
      if (
        Number.isNaN(startedAt.getTime()) ||
        Number.isNaN(endedAt.getTime()) ||
        startedAt >= endedAt
      ) {
        setLocalError(t('time.form.manualTimeOrderError'));
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
            {t('time.form.eyebrow')}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">
            {t('time.form.title')}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-text-secondary">
          {t('time.form.description')}
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
              {t('time.form.manualToggle')}
            </span>
            <span className="mt-1 block text-sm leading-6 text-text-secondary">
              {t('time.form.manualHint')}
            </span>
          </span>
        </label>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="time-entry-project">
              {t('time.form.project')}
            </label>
            <select
              id="time-entry-project"
              value={form.project_id}
              onChange={(event) => updateField('project_id', event.target.value)}
              disabled={disabled || isProjectsLoading}
              className={inputCls}
            >
              <option value="">
                {isProjectsLoading
                  ? t('time.form.loadingProjects')
                  : t('time.form.noProjectSelected')}
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
              {t('time.form.task')}
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
                  ? t('time.form.selectProjectFirst')
                  : isTasksLoading
                    ? t('time.form.loadingTasks')
                    : t('time.form.noTaskSelected')}
              </option>
              {tasks.map((task) => (
                <option key={task.id} value={String(task.id)}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          {!form.project_id ? (
            <div className="space-y-1.5 lg:col-span-2">
              <label
                className="text-sm font-semibold text-text-primary"
                htmlFor="time-entry-no-project-reason"
              >
                {t('time.form.noProjectReason')}
              </label>
              <textarea
                id="time-entry-no-project-reason"
                value={form.no_project_reason}
                onChange={(event) => updateField('no_project_reason', event.target.value)}
                disabled={disabled}
                className={`${inputCls} min-h-28 resize-y`}
                placeholder={t('time.form.noProjectReasonPlaceholder')}
              />
            </div>
          ) : null}

          {form.is_manual ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-primary" htmlFor="time-entry-started-at">
                  {t('time.form.startTime')}
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
                  {t('time.form.endTime')}
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
                ? t('time.form.creating')
                : t('time.form.starting')
              : form.is_manual
                ? t('time.form.createManual')
                : t('time.form.startTimer')}
          </button>
          <p className="text-sm leading-6 text-text-muted">
            {t('time.form.phaseNote')}
          </p>
        </div>
      </form>
    </section>
  );
}
