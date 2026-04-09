'use client';

import type { TimeEntrySummary } from '@lumicore/shared-types';
import type { ReactNode } from 'react';

import { formatDateTime, formatDuration } from './time-utils';

type TimeEntriesListProps = Readonly<{
  entries: TimeEntrySummary[];
}>;

function getStatusLabel(entry: TimeEntrySummary): string {
  if (entry.ended_at === null) {
    return entry.is_paused ? 'Paused' : 'Running';
  }

  return 'Stopped';
}

function Badge({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-1 px-3 py-1 text-xs font-medium text-text-secondary">
      {children}
    </span>
  );
}

export function TimeEntriesList({ entries }: TimeEntriesListProps): JSX.Element {
  if (entries.length === 0) {
    return (
      <section className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Recent entries
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">No time entries yet</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Your recent work log will appear here after you start or add a time entry.
        </p>
      </section>
    );
  }

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
        Recent entries
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
                  <Badge>{getStatusLabel(entry)}</Badge>
                  <Badge>{formatDuration(entry.duration_seconds)}</Badge>
                  <Badge>Paused {formatDuration(entry.pause_duration_seconds)}</Badge>
                  {entry.is_manual ? <Badge>Manual</Badge> : null}
                  {entry.needs_review ? <Badge>Needs review</Badge> : null}
                  {entry.is_confirmed ? <Badge>Confirmed</Badge> : null}
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {entry.project_id ? `Project #${entry.project_id}` : 'No project'}
                  {entry.task_id ? ` · Task #${entry.task_id}` : ''}
                </p>
                <div className="space-y-1 text-sm leading-6 text-text-secondary">
                  <p>Started: {formatDateTime(entry.started_at)}</p>
                  <p>Ended: {formatDateTime(entry.ended_at)}</p>
                  {entry.no_project_reason ? <p>Reason: {entry.no_project_reason}</p> : null}
                </div>
              </div>

              <div className="text-sm leading-6 text-text-muted">
                <p>Entry #{entry.id}</p>
                <p>Employee #{entry.employee_id}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
