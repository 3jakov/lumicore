'use client';

import type { CreateProjectDto } from '@lumicore/shared-types';
import { ProjectStatus } from '@lumicore/shared-types';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useCreateProject } from '@/hooks/use-create-project';
import { useAuthStore } from '@/store/auth.store';

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

const textAreaCls = `${inputCls} min-h-28 resize-y`;

const statusOptions = [
  ProjectStatus.Hinnapakkumises,
  ProjectStatus.Ettevalmistuses,
  ProjectStatus.Toos,
  ProjectStatus.Lopetatud,
] as const;

type FormState = {
  name: string;
  status: ProjectStatus;
  description: string;
  start_date: string;
  end_date: string;
  location_address: string;
  contract_number: string;
  client_company_name: string;
  client_contact_name: string;
  client_phone: string;
  client_email: string;
  project_manager_id: string;
};

const initialFormState: FormState = {
  name: '',
  status: ProjectStatus.Ettevalmistuses,
  description: '',
  start_date: '',
  end_date: '',
  location_address: '',
  contract_number: '',
  client_company_name: '',
  client_contact_name: '',
  client_phone: '',
  client_email: '',
  project_manager_id: '',
};

function toNullableString(value: string): string | null | undefined {
  return value.trim() ? value.trim() : undefined;
}

function toNullableDate(value: string): string | null | undefined {
  return value ? value : undefined;
}

function toNullableNumber(value: string): number | null | undefined {
  if (!value.trim()) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPayload(state: FormState): CreateProjectDto {
  return {
    name: state.name.trim(),
    status: state.status,
    description: toNullableString(state.description),
    start_date: toNullableDate(state.start_date),
    end_date: toNullableDate(state.end_date),
    location_address: toNullableString(state.location_address),
    contract_number: toNullableString(state.contract_number),
    client_company_name: toNullableString(state.client_company_name),
    client_contact_name: toNullableString(state.client_contact_name),
    client_phone: toNullableString(state.client_phone),
    client_email: toNullableString(state.client_email),
    project_manager_id: toNullableNumber(state.project_manager_id),
  };
}

export function ProjectCreateForm(): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const { isLoading, error, createProject } = useCreateProject();

  const [form, setForm] = useState<FormState>(initialFormState);
  const [localError, setLocalError] = useState<string | null>(null);

  const trimmedName = form.name.trim();
  const canSubmit = isAdmin && trimmedName.length > 0 && !isLoading;
  const helperText = useMemo(
    () =>
      'Project manager is a numeric employee ID for now. It will be replaced with an employee selector once the Employees module is ready.',
    [],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]): void {
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

    await createProject(buildPayload(form));
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
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-semibold text-text-primary" htmlFor="project-name">
              Project name
            </label>
            <input
              id="project-name"
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              disabled={isLoading}
              className={inputCls}
              placeholder="Example: Tartu maja aknad"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="project-status">
              Status
            </label>
            <select
              id="project-status"
              value={form.status}
              onChange={(event) => updateField('status', event.target.value as ProjectStatus)}
              disabled={isLoading}
              className={inputCls}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="project-manager-id">
              Project manager ID
            </label>
            <input
              id="project-manager-id"
              type="number"
              min={1}
              step={1}
              value={form.project_manager_id}
              onChange={(event) => updateField('project_manager_id', event.target.value)}
              disabled={isLoading}
              className={inputCls}
              placeholder="Optional employee ID"
            />
            <p className="text-xs leading-5 text-text-muted">{helperText}</p>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-semibold text-text-primary" htmlFor="project-description">
              Description
            </label>
            <textarea
              id="project-description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              disabled={isLoading}
              className={textAreaCls}
              placeholder="Optional notes about the job scope or context"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="project-start-date">
              Start date
            </label>
            <input
              id="project-start-date"
              type="date"
              value={form.start_date}
              onChange={(event) => updateField('start_date', event.target.value)}
              disabled={isLoading}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="project-end-date">
              End date
            </label>
            <input
              id="project-end-date"
              type="date"
              value={form.end_date}
              onChange={(event) => updateField('end_date', event.target.value)}
              disabled={isLoading}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-semibold text-text-primary" htmlFor="project-location">
              Location address
            </label>
            <input
              id="project-location"
              type="text"
              value={form.location_address}
              onChange={(event) => updateField('location_address', event.target.value)}
              disabled={isLoading}
              className={inputCls}
              placeholder="Optional address"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="contract-number">
              Contract number
            </label>
            <input
              id="contract-number"
              type="text"
              value={form.contract_number}
              onChange={(event) => updateField('contract_number', event.target.value)}
              disabled={isLoading}
              className={inputCls}
              placeholder="Optional contract reference"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="client-company">
              Client company
            </label>
            <input
              id="client-company"
              type="text"
              value={form.client_company_name}
              onChange={(event) => updateField('client_company_name', event.target.value)}
              disabled={isLoading}
              className={inputCls}
              placeholder="Optional company name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="client-contact">
              Client contact
            </label>
            <input
              id="client-contact"
              type="text"
              value={form.client_contact_name}
              onChange={(event) => updateField('client_contact_name', event.target.value)}
              disabled={isLoading}
              className={inputCls}
              placeholder="Optional contact name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="client-phone">
              Client phone
            </label>
            <input
              id="client-phone"
              type="tel"
              value={form.client_phone}
              onChange={(event) => updateField('client_phone', event.target.value)}
              disabled={isLoading}
              className={inputCls}
              placeholder="Optional phone number"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-semibold text-text-primary" htmlFor="client-email">
              Client email
            </label>
            <input
              id="client-email"
              type="email"
              value={form.client_email}
              onChange={(event) => updateField('client_email', event.target.value)}
              disabled={isLoading}
              className={inputCls}
              placeholder="Optional email address"
            />
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
            {isLoading ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </section>
  );
}
