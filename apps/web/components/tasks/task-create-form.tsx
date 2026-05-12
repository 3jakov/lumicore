'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  TaskFormFields,
  buildCreateTaskPayload,
  emptyTaskFormState,
  type TaskFormState,
} from '@/components/tasks/task-form';
import { useCreateTask } from '@/hooks/use-create-task';

export function TaskCreateForm(): JSX.Element {
  const { isLoading, error, createTask } = useCreateTask();
  const [form, setForm] = useState<TaskFormState>(emptyTaskFormState);
  const [localError, setLocalError] = useState<string | null>(null);

  const trimmedName = form.name.trim();
  const canSubmit = trimmedName.length > 0 && !isLoading;

  function updateField<K extends keyof TaskFormState>(key: K, value: TaskFormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!trimmedName) {
      setLocalError('Task name is required.');
      return;
    }

    await createTask(buildCreateTaskPayload(form));
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
        <TaskFormFields disabled={isLoading} form={form} onFieldChange={updateField} />

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
