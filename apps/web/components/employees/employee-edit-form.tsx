'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  EmployeeFormFields,
  buildUpdateEmployeePayload,
  emptyEmployeeFormState,
  hasEmployeeFormChanges,
  normalizeEmployeeFormState,
  type EmployeeFormState,
} from '@/components/employees/employee-form';
import { useEmployee } from '@/hooks/use-employee';
import { useRoles } from '@/hooks/use-roles';
import { useUpdateEmployee } from '@/hooks/use-update-employee';
import { useAuthStore } from '@/store/auth.store';

type EmployeeEditFormProps = Readonly<{
  id: number;
}>;

function LoadingState(): JSX.Element {
  return (
    <section className="panel animate-pulse p-6 md:p-8">
      <div className="h-4 w-24 rounded bg-border-subtle" />
      <div className="mt-4 h-8 w-64 rounded bg-border-subtle" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 10 }).map((_, index) => (
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
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">People</p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Employee not found</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          The employee could not be loaded for editing right now.
        </p>
      </div>
      <Link
        href={`/team/people/${id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to employee
      </Link>
    </section>
  );
}

export function EmployeeEditForm({ id }: EmployeeEditFormProps): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const { data, error: loadError, isError, isLoading } = useEmployee(id);
  const { data: roles = [] } = useRoles();
  const { isLoading: isSaving, error: submitError, updateEmployee } = useUpdateEmployee(id);

  const [form, setForm] = useState<EmployeeFormState>(emptyEmployeeFormState);
  const [initialForm, setInitialForm] = useState<EmployeeFormState>(emptyEmployeeFormState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!data || isInitialized) return;

    const normalized = normalizeEmployeeFormState(data);
    normalized.role_ids = roles
      .filter((role) => data.roles.includes(role.name))
      .map((role) => String(role.id));

    setForm(normalized);
    setInitialForm(normalized);
    setIsInitialized(true);
    setLocalError(null);
  }, [data, isInitialized, roles]);

  const trimmedName = form.full_name.trim();
  const hasChanges = hasEmployeeFormChanges(initialForm, form);
  const canSubmit = isAdmin && trimmedName.length > 0 && hasChanges && !isSaving;

  function updateField<K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!isAdmin) {
      setLocalError('Only administrators can update employees.');
      return;
    }

    if (!trimmedName) {
      setLocalError('Employee full name is required.');
      return;
    }

    if (!hasChanges) {
      setLocalError('There are no changes to save yet.');
      return;
    }

    await updateEmployee(buildUpdateEmployeePayload(initialForm, form));
  }

  if (isLoading && !data) return <LoadingState />;
  if ((isError && !data) || (!isLoading && !data && loadError)) return <ErrorState id={id} />;
  if (!data) return <ErrorState id={id} />;

  if (!isAdmin) {
    return (
      <section className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">People</p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Admin access required</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Updating employees is currently restricted to the <span className="font-semibold">Administraator</span> role.
        </p>
        <Link
          href={`/team/people/${id}`}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
        >
          Back to employee
        </Link>
      </section>
    );
  }

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">People</p>
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">Edit employee</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
        Update the employee record using the current Phase 1 management surface.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <EmployeeFormFields
          disabled={isSaving}
          form={form}
          onFieldChange={updateField}
          roles={roles}
          showStatus
          showSensitiveFields
        />

        {localError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {localError}
          </p>
        ) : null}
        {submitError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/team/people/${id}`}
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
