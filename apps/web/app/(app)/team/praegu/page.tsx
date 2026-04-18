'use client';

import type {
  ActiveTimerEntry,
} from '@lumicore/shared-types';
import { Activity, AlertCircle, PauseCircle, PlayCircle, RefreshCcw, TimerReset } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { formatDuration, formatTime, getLivePraeguSeconds } from '@/components/time/time-utils';
import { usePraegu } from '@/hooks/use-praegu';
import { socketClient } from '@/lib/socket';
import { queryKeys } from '@/lib/query/query-keys';
import { useSocketStore } from '@/store/socket.store';

function sortEntries(entries: ActiveTimerEntry[]): ActiveTimerEntry[] {
  return [...entries].sort((a, b) => a.started_at.localeCompare(b.started_at));
}

function LoadingState(): JSX.Element {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <section key={index} className="panel animate-pulse p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <div className="h-4 w-20 rounded bg-border-subtle" />
              <div className="h-7 w-44 rounded bg-border-subtle" />
            </div>
            <div className="h-8 w-24 rounded-full bg-border-subtle" />
          </div>
          <div className="mt-6 h-10 w-32 rounded bg-border-subtle" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-3/4 rounded bg-border-subtle" />
            <div className="h-4 w-2/3 rounded bg-border-subtle" />
            <div className="h-4 w-1/2 rounded bg-border-subtle" />
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState({ connected }: Readonly<{ connected: boolean }>): JSX.Element {
  return (
    <section className="panel flex flex-col items-center gap-4 py-16 text-center">
      <TimerReset className="h-8 w-8 text-text-muted" />
      <div>
        <p className="font-semibold text-text-primary">No active timers right now</p>
        <p className="mt-1 text-sm text-text-secondary">
          Praegu will update automatically when someone starts tracking time.
        </p>
      </div>
      <span className="pill">
        <Activity className="h-4 w-4" />
        {connected ? 'Live' : 'Offline'}
      </span>
    </section>
  );
}

function ErrorState({ onRetry }: Readonly<{ onRetry: () => void }>): JSX.Element {
  return (
    <section className="panel flex flex-col items-center gap-4 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <div>
        <p className="font-semibold text-text-primary">Failed to load Praegu</p>
        <p className="mt-1 text-sm text-text-secondary">
          The live snapshot could not be loaded. Try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
      >
        <RefreshCcw className="h-4 w-4" />
        Reload
      </button>
    </section>
  );
}

function StatusBadge({ paused }: Readonly<{ paused: boolean }>): JSX.Element {
  if (paused) {
    return (
      <span className="pill border-amber-200 bg-amber-50 text-amber-800">
        <PauseCircle className="h-4 w-4" />
        Paused
      </span>
    );
  }

  return (
    <span className="pill border-emerald-200 bg-emerald-50 text-emerald-800">
      <PlayCircle className="h-4 w-4" />
      Running
    </span>
  );
}

function PraeguCard({
  entry,
  nowMs,
  snapshotMs,
}: Readonly<{
  entry: ActiveTimerEntry;
  nowMs: number;
  snapshotMs: number;
}>): JSX.Element {
  const liveDuration = useMemo(
    () => getLivePraeguSeconds(entry, nowMs, snapshotMs),
    [entry, nowMs, snapshotMs],
  );

  return (
    <section className="panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
            Employee
          </p>
          <h2 className="text-2xl font-semibold text-text-primary">{entry.employee_name}</h2>
        </div>
        <StatusBadge paused={entry.is_paused} />
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Elapsed</p>
        <p className="mt-2 text-4xl font-semibold text-accent-700">{formatDuration(liveDuration)}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Project</p>
          <p className="mt-2 text-sm leading-6 text-text-primary">
            {entry.project_name ?? 'No project'}
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Task</p>
          <p className="mt-2 text-sm leading-6 text-text-primary">{entry.task_name ?? 'No task'}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Started</p>
          <p className="mt-2 text-sm leading-6 text-text-primary">{formatTime(entry.started_at)}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
            Paused total
          </p>
          <p className="mt-2 text-sm leading-6 text-text-primary">
            {formatDuration(entry.pause_duration_seconds)}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function PraeguPage(): JSX.Element {
  const queryClient = useQueryClient();
  const connected = useSocketStore((state) => state.connected);
  const setConnected = useSocketStore((state) => state.setConnected);
  const { data, isLoading, isError, refetch } = usePraegu();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [snapshotMs, setSnapshotMs] = useState(() => Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (data) {
      setSnapshotMs(Date.now());
    }
  }, [data]);

  useEffect(() => {
    const socket = socketClient.connect();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const refreshPraegu = (..._args: unknown[]) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.praegu });
    };

    socketClient.on('connect', handleConnect);
    socketClient.on('disconnect', handleDisconnect);
    socketClient.on('timer:started', refreshPraegu);
    socketClient.on('timer:paused', refreshPraegu);
    socketClient.on('timer:resumed', refreshPraegu);
    socketClient.on('timer:stopped', refreshPraegu);

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socketClient.off('connect', handleConnect);
      socketClient.off('disconnect', handleDisconnect);
      socketClient.off('timer:started', refreshPraegu);
      socketClient.off('timer:paused', refreshPraegu);
      socketClient.off('timer:resumed', refreshPraegu);
      socketClient.off('timer:stopped', refreshPraegu);
    };
  }, [queryClient, setConnected]);

  const entries = useMemo(() => sortEntries(data ?? []), [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Team"
          title="Praegu"
          description="Live overview of everyone currently tracking time across field and production."
        />
        <span className="pill self-start lg:self-auto">
          <Activity className="h-4 w-4" />
          {connected ? 'Live socket connected' : 'Socket reconnecting'}
        </span>
      </div>

      {isLoading ? <LoadingState /> : null}
      {!isLoading && isError ? <ErrorState onRetry={() => void refetch()} /> : null}
      {!isLoading && !isError && entries.length === 0 ? <EmptyState connected={connected} /> : null}
      {!isLoading && !isError && entries.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {entries.map((entry) => (
            <PraeguCard
              key={entry.time_entry_id}
              entry={entry}
              nowMs={nowMs}
              snapshotMs={snapshotMs}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
