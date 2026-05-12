'use client';

import type { TimeEntrySummary } from '@lumicore/shared-types';
import type { ReactNode } from 'react';

import { useTranslation } from '@/hooks/use-translation';
import type { DictionaryKey } from '@/lib/i18n';

import { formatDateTime, formatDuration } from './time-utils';

type TimeEntriesListProps = Readonly<{
  entries: TimeEntrySummary[];
}>;

function getStatusKey(entry: TimeEntrySummary): DictionaryKey {
  if (entry.ended_at === null) {
    return entry.is_paused ? 'time.paused' : 'time.running';
  }

  return 'time.stopped';
}

function Badge({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-1 px-3 py-1 text-xs font-medium text-text-secondary">
      {children}
    </span>
  );
}

export function TimeEntriesList({ entries }: TimeEntriesListProps): JSX.Element {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <section className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          {t('time.recentEntries')}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">
          {t('time.noEntriesTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          {t('time.noEntriesDescription')}
        </p>
      </section>
    );
  }

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
        {t('time.recentEntries')}
      </p>
      <div className="mt-5 grid gap-4">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-border-subtle bg-surface-1 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{t(getStatusKey(entry))}</Badge>
                  <Badge>{formatDuration(entry.duration_seconds)}</Badge>
                  <Badge>
                    {t('time.paused')}{' '}
                    {formatDuration(entry.pause_duration_seconds)}
                  </Badge>
                  {entry.is_manual ? <Badge>{t('time.manual')}</Badge> : null}
                  {entry.needs_review ? <Badge>{t('time.needsReview')}</Badge> : null}
                  {entry.is_confirmed ? <Badge>{t('time.confirmed')}</Badge> : null}
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {entry.project_id
                    ? `${t('time.projectNumber')} #${entry.project_id}`
                    : t('time.noProject')}
                  {entry.task_id ? ` · ${t('time.taskNumber')} #${entry.task_id}` : ''}
                </p>
                <div className="space-y-1 text-sm leading-6 text-text-secondary">
                  <p>
                    {t('time.started')}: {formatDateTime(entry.started_at)}
                  </p>
                  <p>
                    {t('time.ended')}: {formatDateTime(entry.ended_at)}
                  </p>
                  {entry.no_project_reason ? (
                    <p>
                      {t('time.reason')}: {entry.no_project_reason}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="text-sm leading-6 text-text-muted">
                <p>
                  {t('time.entryNumber')} #{entry.id}
                </p>
                <p>
                  {t('time.employeeNumber')} #{entry.employee_id}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
