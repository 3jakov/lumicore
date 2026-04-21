'use client';

import type { TimeEntrySummary } from '@lumicore/shared-types';
import { PauseCircle, PlayCircle, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { usePauseTimeEntry } from '@/hooks/use-pause-time-entry';
import { useResumeTimeEntry } from '@/hooks/use-resume-time-entry';
import { useStopTimeEntry } from '@/hooks/use-stop-time-entry';
import { useTranslation } from '@/hooks/use-translation';

import { formatDateTime, formatDuration, getLiveTrackedSeconds } from './time-utils';

type ActiveTimerPanelProps = Readonly<{
  entry: TimeEntrySummary;
}>;

export function ActiveTimerPanel({ entry }: ActiveTimerPanelProps): JSX.Element {
  const { t } = useTranslation();
  const { isLoading: isPausing, error: pauseError, pauseTimeEntry } = usePauseTimeEntry();
  const { isLoading: isResuming, error: resumeError, resumeTimeEntry } = useResumeTimeEntry();
  const { isLoading: isStopping, error: stopError, stopTimeEntry } = useStopTimeEntry();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (entry.ended_at !== null || entry.is_paused) return;

    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [entry.ended_at, entry.is_paused]);

  const liveDuration = useMemo(() => getLiveTrackedSeconds(entry, nowMs), [entry, nowMs]);
  const actionError = pauseError ?? resumeError ?? stopError;
  const isBusy = isPausing || isResuming || isStopping;

  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
        {t('time.activeTimer')}
      </p>
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-text-primary">
            {entry.is_paused ? t('time.paused') : t('time.running')}
          </h2>
          <p className="text-4xl font-semibold text-accent-700">{formatDuration(liveDuration)}</p>
          <div className="space-y-1 text-sm text-text-secondary">
            <p>
              {t('time.started')}: {formatDateTime(entry.started_at)}
            </p>
            <p>
              {entry.project_id
                ? `${t('time.projectNumber')} #${entry.project_id}`
                : t('time.noProjectLinked')}
              {entry.task_id ? ` • ${t('time.taskNumber')} #${entry.task_id}` : ''}
            </p>
            {entry.no_project_reason ? (
              <p>
                {t('time.reason')}: {entry.no_project_reason}
              </p>
            ) : null}
            <p>
              {t('time.pausedTotal')}: {formatDuration(entry.pause_duration_seconds)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {entry.is_paused ? (
            <button
              type="button"
              onClick={() => void resumeTimeEntry(entry.id)}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlayCircle className="h-4 w-4" />
              {isResuming ? t('time.resuming') : t('time.resume')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void pauseTimeEntry(entry.id)}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PauseCircle className="h-4 w-4" />
              {isPausing ? t('time.pausing') : t('time.pause')}
            </button>
          )}

          <button
            type="button"
            onClick={() => void stopTimeEntry(entry.id)}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Square className="h-4 w-4" />
            {isStopping ? t('time.stopping') : t('time.stop')}
          </button>
        </div>
      </div>

      {actionError && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError}
        </p>
      )}
    </section>
  );
}
