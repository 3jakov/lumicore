import type { TimeEntrySummary } from '@lumicore/shared-types';

export function formatDateTime(value: string | null): string {
  if (!value) return 'In progress';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null) return 'In progress';

  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

export function getActiveTimeEntry(entries: TimeEntrySummary[] | undefined): TimeEntrySummary | null {
  return entries?.find((entry) => entry.ended_at === null) ?? null;
}

export function getLiveTrackedSeconds(entry: TimeEntrySummary, nowMs: number): number | null {
  if (entry.ended_at !== null || entry.is_paused) {
    return entry.duration_seconds;
  }

  const startedAt = new Date(entry.started_at);
  if (Number.isNaN(startedAt.getTime())) {
    return entry.duration_seconds;
  }

  const elapsedSeconds =
    Math.floor((nowMs - startedAt.getTime()) / 1000) - entry.pause_duration_seconds;

  return Math.max(0, elapsedSeconds);
}
