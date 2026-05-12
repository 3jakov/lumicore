'use client';

import { AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  TaskFormFields,
  buildUpdateTaskPayload,
  emptyTaskFormState,
  hasTaskFormChanges,
  normalizeTaskFormState,
  type TaskFormState,
} from '@/components/tasks/task-form';
import { useTask } from '@/hooks/use-task';
import { useUpdateTask } from '@/hooks/use-update-task';

type TaskEditFormProps = Readonly<{
  id: number;
}>;

function LoadingState(): JSX.Element {
  return (
    <section className="panel animate-pulse p-6 md:p-8">
      <div className="h-4 w-24 rounded bg-border-subtle" />
      <div className="mt-4 h-8 w-64 rounded bg-border-subtle" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="h-3 w-28 rounded bg-border-subtle" />
            <div className="h-12 rounded-xl bg-border-subtle" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ErrorState({ id }: Readonly<{ id: number }>): JSX.Element {
  return (
    <section className="panel flex flex-col items-start gap-4 p-6 md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">Tasks</p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Task not found</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          The task could not be loaded for editing right now.
        </p>
      </div>
      <Link
        href={`/tasks/${id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to task
      </Link>
    </section>
  );
}

export function TaskEditForm({ id }: TaskEditFormProps): JSX.Element {
  const { data, error: loadError, isError, isLoading } = useTask(id);
  const { isLoading: isSaving, error: submitError, updateTask } = useUpdateTask(id);

  const [form, setForm] = useState<TaskFormState>(emptyTaskFormState);
  const [initialForm, setInitialForm] = useState<TaskFormState>(emptyTaskFormState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!data || isInitialized) return;

    const normalized = normalizeTaskFormState(data);
    setForm(normalized);
    setInitialForm(normalized);
    setIsInitialized(true);
    setLocalError(null);
  }, [data, isInitialized]);

  const trimmedName = form.name.trim();
  const hasChanges = hasTaskFormChanges(initialForm, form);
  const canSubmit = trimmedName.length > 0 && hasChanges && !isSaving;

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

    if (!hasChanges) {
      setLocalError('There are no changes to save yet.');
      return;
    }

    await updateTask(buildUpdateTaskPayload(initialForm, form));
  }

  if (isLoading && !data) {
    return <LoadingState />;
  }

  if ((isError && !data) || (!isLoading && !data && loadError)) {
    return <ErrorState id={id} />;
  }

  if (!data) {
    return <ErrorState id={id} />;
  }

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">Tasks</p>
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">Edit task</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
        Update the baseline task record now. Archive flow, comments, and richer execution context
        can layer on in the next iteration.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <TaskFormFields disabled={isSaving} form={form} onFieldChange={updateField} />

        {localError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {localError}
          </p>
        )}
        {submitError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </p>
        )}
        {isError && data && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              The latest task data could not be refreshed. You can still review the loaded values,
              but try reopening this page if anything looks out of date.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/tasks/${id}`}
            className="text-sm font-semibold text-text-secondary transition hover:text-text-primary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-2xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
