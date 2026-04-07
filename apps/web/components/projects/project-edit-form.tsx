'use client';

import { AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  ProjectFormFields,
  buildUpdateProjectPayload,
  emptyProjectFormState,
  hasProjectFormChanges,
  normalizeProjectFormState,
  type ProjectFormState,
} from '@/components/projects/project-form';
import { useProject } from '@/hooks/use-project';
import { useUpdateProject } from '@/hooks/use-update-project';
import { useAuthStore } from '@/store/auth.store';

type ProjectEditFormProps = Readonly<{
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

function ErrorState(): JSX.Element {
  return (
    <section className="panel flex flex-col items-start gap-4 p-6 md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Projects
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Project not found</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          The project could not be loaded for editing right now.
        </p>
      </div>
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to projects
      </Link>
    </section>
  );
}

export function ProjectEditForm({ id }: ProjectEditFormProps): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const { data, error: loadError, isError, isLoading } = useProject(id);
  const { isLoading: isSaving, error: submitError, updateProject } = useUpdateProject(id);

  const [form, setForm] = useState<ProjectFormState>(emptyProjectFormState);
  const [initialForm, setInitialForm] = useState<ProjectFormState>(emptyProjectFormState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const helperText = useMemo(
    () => 'Select an employee to own the project, or leave it unassigned for now.',
    [],
  );

  useEffect(() => {
    if (!data || isInitialized) return;

    const normalized = normalizeProjectFormState(data);
    setForm(normalized);
    setInitialForm(normalized);
    setIsInitialized(true);
    setLocalError(null);
  }, [data, isInitialized]);

  const trimmedName = form.name.trim();
  const hasChanges = hasProjectFormChanges(initialForm, form);
  const canSubmit = isAdmin && trimmedName.length > 0 && hasChanges && !isSaving;

  function updateField<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!isAdmin) {
      setLocalError('Only administrators can update projects.');
      return;
    }

    if (!trimmedName) {
      setLocalError('Project name is required.');
      return;
    }

    if (!hasChanges) {
      setLocalError('There are no changes to save yet.');
      return;
    }

    await updateProject(buildUpdateProjectPayload(initialForm, form));
  }

  if (isLoading && !data) {
    return <LoadingState />;
  }

  if ((isError && !data) || (!isLoading && !data && loadError)) {
    return <ErrorState />;
  }

  if (!data) {
    return <ErrorState />;
  }

  if (!isAdmin) {
    return (
      <section className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Projects
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Admin access required</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Updating projects is currently restricted to the{' '}
          <span className="font-semibold">Administraator</span> role.
        </p>
        <Link
          href={`/projects/${id}`}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
        >
          Back to project
        </Link>
      </section>
    );
  }

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">Projects</p>
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">Edit project</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
        Update the core project record now. Assignments and richer team workflows can expand as
        the Employees and Tasks modules mature.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <ProjectFormFields
          disabled={isSaving}
          form={form}
          helperText={helperText}
          onFieldChange={updateField}
        />

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
              The latest project data could not be refreshed. You can still review the loaded
              values, but try reopening this page if anything looks out of date.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/projects/${id}`}
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
