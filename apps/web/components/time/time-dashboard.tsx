'use client';

import { useEffect } from 'react';

import { useTimeEntries } from '@/hooks/use-time-entries';
import { useTranslation } from '@/hooks/use-translation';
import { useTimerStore } from '@/store/timer.store';

import { ActiveTimerPanel } from './active-timer-panel';
import { TimeEntriesList } from './time-entries-list';
import { TimeEntryForm } from './time-entry-form';
import { getActiveTimeEntry } from './time-utils';

export function TimeDashboard(): JSX.Element {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useTimeEntries({ limit: 100 });
  const setActiveTimer = useTimerStore((state) => state.setActiveTimer);
  const entries = data?.data ?? [];
  const activeEntry = getActiveTimeEntry(entries);

  useEffect(() => {
    if (activeEntry) {
      setActiveTimer({
        timeEntryId: activeEntry.id,
        startedAt: activeEntry.started_at,
        label: activeEntry.project_id
          ? `${t('time.projectNumber')} #${activeEntry.project_id}`
          : t('time.noProjectTimer'),
      });
      return;
    }

    setActiveTimer(null);
  }, [activeEntry, setActiveTimer, t]);

  if (isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <p className="text-sm text-text-secondary">{t('time.loadingEntries')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="panel p-6 md:p-8">
        <p role="alert" className="text-sm text-red-600">
          {'message' in (error ?? {}) && typeof error?.message === 'string'
            ? error.message
            : t('time.failedToLoad')}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {activeEntry ? <ActiveTimerPanel entry={activeEntry} /> : null}
      <TimeEntryForm />
      <TimeEntriesList entries={entries.slice(0, 12)} />
    </div>
  );
}
