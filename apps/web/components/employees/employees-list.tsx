'use client';

import type { EmployeeSummary } from '@lumicore/shared-types';
import { AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';

import { useEmployees } from '@/hooks/use-employees';
import { useTranslation } from '@/hooks/use-translation';

function EmployeeCardSkeleton(): JSX.Element {
  return (
    <div className="panel animate-pulse p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="h-5 w-40 rounded bg-border-subtle" />
          <div className="h-4 w-24 rounded bg-border-subtle" />
        </div>
        <div className="h-6 w-20 rounded-full bg-border-subtle" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-border-subtle" />
        <div className="h-6 w-16 rounded-full bg-border-subtle" />
      </div>
    </div>
  );
}

function EmployeeCard({ employee }: Readonly<{ employee: EmployeeSummary }>): JSX.Element {
  const { t } = useTranslation();
  const statusTone =
    employee.status === 'Aktiivne'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <Link
      href={`/team/people/${employee.id}`}
      className="panel group flex flex-col gap-4 p-5 transition hover:border-border-strong hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white"
            style={{ backgroundColor: employee.avatar_color }}
          >
            {employee.initials}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-text-primary transition group-hover:text-accent-700">
              {employee.full_name}
            </p>
            <p className="text-sm text-text-secondary">{employee.group}</p>
          </div>
        </div>
        <span className={`pill ${statusTone}`}>{employee.status}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {employee.roles.length > 0 ? (
          employee.roles.map((role) => (
            <span key={role} className="pill">
              {role}
            </span>
          ))
        ) : (
          <span className="text-sm text-text-muted">{t('team.people.noRoles')}</span>
        )}
      </div>
    </Link>
  );
}

function LoadingState(): JSX.Element {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <EmployeeCardSkeleton key={index} />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: Readonly<{ onRetry: () => void }>): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="panel flex flex-col items-center gap-4 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <div>
        <p className="font-semibold text-text-primary">{t('team.people.failedToLoad')}</p>
        <p className="mt-1 text-sm text-text-secondary">{t('team.people.failedDescription')}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
      >
        {t('common.retry')}
      </button>
    </section>
  );
}

function EmptyState(): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="panel flex flex-col items-center gap-4 py-16 text-center">
      <Users className="h-8 w-8 text-text-muted" />
      <div>
        <p className="font-semibold text-text-primary">{t('team.people.emptyTitle')}</p>
        <p className="mt-1 text-sm text-text-secondary">{t('team.people.emptyDescription')}</p>
      </div>
    </section>
  );
}

export function EmployeesList(): JSX.Element {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useEmployees();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const employees = data?.data ?? [];

  if (employees.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        {data?.meta.total ?? employees.length}{' '}
        {(data?.meta.total ?? employees.length) === 1
          ? t('team.people.countSingular')
          : t('team.people.countPlural')}
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        {employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>
    </div>
  );
}
