'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  EmployeeFormFields,
  buildCreateEmployeePayload,
  emptyEmployeeFormState,
  type EmployeeFormState,
} from '@/components/employees/employee-form';
import { useCreateEmployee } from '@/hooks/use-create-employee';
import { useRoles } from '@/hooks/use-roles';
import { useAuthStore } from '@/store/auth.store';

export function EmployeeCreateForm(): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const { isLoading, error, createEmployee } = useCreateEmployee();
  const { data: roles = [] } = useRoles();

  const [form, setForm] = useState<EmployeeFormState>(emptyEmployeeFormState);
  const [localError, setLocalError] = useState<string | null>(null);

  const trimmedName = form.full_name.trim();
  const canSubmit = isAdmin && trimmedName.length > 0 && !isLoading;

  function updateField<K extends keyof EmployeeFormState>(key: K, value: EmployeeFormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!isAdmin) {
      setLocalError('Only administrators can create employees.');
      return;
    }

    if (!trimmedName) {
      setLocalError('Employee full name is required.');
      return;
    }

    await createEmployee(buildCreateEmployeePayload(form));
  }

  if (!isAdmin) {
    return (
      <section className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">People</p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Admin access required</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Creating employees is currently restricted to the <span className="font-semibold">Administraator</span> role.
        </p>
        <Link
          href="/team/people"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
        >
          Back to people
        </Link>
      </section>
    );
  }

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">People</p>
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">Create employee</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
        Add a new employee record using the current Phase 1 employee contract.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <EmployeeFormFields
          disabled={isLoading}
          form={form}
          onFieldChange={updateField}
          roles={roles}
          showSensitiveFields
        />

        {localError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {localError}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/team/people"
            className="text-sm font-semibold text-text-secondary transition hover:text-text-primary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-2xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create employee'}
          </button>
        </div>
      </form>
    </section>
  );
}
