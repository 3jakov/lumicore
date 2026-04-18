'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { useArchiveEmployee } from '@/hooks/use-archive-employee';
import { useEmployee } from '@/hooks/use-employee';
import { useAuthStore } from '@/store/auth.store';

type EmployeeDetailShellProps = Readonly<{
  id: number;
}>;

function LoadingState(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="panel animate-pulse p-6">
        <div className="h-4 w-24 rounded bg-border-subtle" />
        <div className="mt-4 h-8 w-56 rounded bg-border-subtle" />
        <div className="mt-6 h-5 w-40 rounded bg-border-subtle" />
      </div>
      <div className="panel animate-pulse p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-3 w-24 rounded bg-border-subtle" />
              <div className="h-4 w-3/4 rounded bg-border-subtle" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState(): JSX.Element {
  return (
    <section className="panel flex flex-col items-start gap-4 p-6 text-left">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">People</p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Employee not found</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          This employee could not be found or you do not have access to the detail page.
        </p>
      </div>
      <Link
        href="/team/people"
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to people
      </Link>
    </section>
  );
}

function DetailField({
  label,
  value,
}: Readonly<{ label: string; value: string | number | null | undefined }>): JSX.Element {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text-primary">{value ?? 'Not set'}</p>
    </div>
  );
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function EmployeeDetailShell({ id }: EmployeeDetailShellProps): JSX.Element {
  const { data, isLoading, isError } = useEmployee(id);
  const { isLoading: isArchiving, error: archiveError, archiveEmployee } = useArchiveEmployee(id);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState />;

  async function handleArchive(): Promise<void> {
    const confirmed = window.confirm(
      'Archive this employee? The record will be retained for audit history.',
    );

    if (!confirmed) return;
    await archiveEmployee();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/team/people"
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        People
      </Link>

      <section className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-lg font-semibold text-white"
              style={{ backgroundColor: data.avatar_color }}
            >
              {data.initials}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill">{data.group}</span>
                <span className="pill">{data.status}</span>
              </div>
              <h1 className="text-3xl font-semibold text-text-primary">{data.full_name}</h1>
              <div className="flex flex-wrap gap-2">
                {data.roles.length > 0 ? data.roles.map((role) => <span key={role} className="pill">{role}</span>) : <span className="text-sm text-text-muted">No roles assigned</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <Link
                  href={`/team/people/${id}/edit`}
                  className="inline-flex items-center justify-center rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
                >
                  Edit employee
                </Link>
                <button
                  type="button"
                  onClick={() => void handleArchive()}
                  disabled={isArchiving}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isArchiving ? 'Archiving...' : 'Archive employee'}
                </button>
              </div>
            ) : null}
            <p className="text-sm leading-6 text-text-secondary md:max-w-sm md:text-right">
              Employee detail includes profile and staff-management information available in the current backend scope.
            </p>
          </div>
        </div>
        {archiveError ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {archiveError}
          </p>
        ) : null}
      </section>

      <section className="panel space-y-6 p-6 md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">Employee</p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">Employee details</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailField label="Phone" value={data.phone} />
          <DetailField label="Email" value={data.email} />
          <DetailField label="Language" value={data.language} />
          <DetailField label="Time format" value={data.time_format} />
          <DetailField label="Work schedule" value={data.work_schedule} />
          <DetailField label="Norm hours per week" value={data.norm_hours_per_week} />
          <DetailField label="Project access" value={data.project_access_all ? 'All projects' : 'Restricted'} />
          <DetailField label="Created" value={formatDateTime(data.created_at)} />
          <DetailField label="Updated" value={formatDateTime(data.updated_at)} />
          <DetailField label="Additional info" value={data.additional_info} />
          {isAdmin ? (
            <>
              <DetailField label="Hourly rate" value={data.hourly_rate} />
              <DetailField label="Personal ID" value={data.personal_id} />
              <DetailField label="Birth date" value={data.birth_date} />
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
