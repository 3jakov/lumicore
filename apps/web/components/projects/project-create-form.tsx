'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  ProjectFormFields,
  buildCreateProjectPayload,
  emptyProjectFormState,
  type ProjectFormState,
} from '@/components/projects/project-form';
import { useCreateProject } from '@/hooks/use-create-project';
import { useAuthStore } from '@/store/auth.store';

export function ProjectCreateForm(): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const { isLoading, error, createProject } = useCreateProject();

  const [form, setForm] = useState<ProjectFormState>(emptyProjectFormState);
  const [localError, setLocalError] = useState<string | null>(null);

  const trimmedName = form.name.trim();
  const canSubmit = isAdmin && trimmedName.length > 0 && !isLoading;
  const helperText = useMemo(
    () => 'Select an employee to own the project, or leave it unassigned for now.',
    [],
  );

  function updateField<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!isAdmin) {
      setLocalError('Only administrators can create new projects.');
      return;
    }

    if (!trimmedName) {
      setLocalError('Project name is required.');
      return;
    }

    await createProject(buildCreateProjectPayload(form));
  }

  if (!isAdmin) {
    return (
      <section className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Projects
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Admin access required</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Creating projects is currently restricted to the <span className="font-semibold">Administraator</span> role.
        </p>
        <Link
          href="/projects"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
        >
          Back to projects
        </Link>
      </section>
    );
  }

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">Projects</p>
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">Create project</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
        Start with the core project record. Assignees, tasks, and document links can layer onto
        this once their modules are fully integrated.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <ProjectFormFields
          disabled={isLoading}
          form={form}
          helperText={helperText}
          onFieldChange={updateField}
        />

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
            href="/projects"
            className="text-sm font-semibold text-text-secondary transition hover:text-text-primary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-2xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create project'}
          </button>
        </div>
      </form>
    </section>
  );
}
