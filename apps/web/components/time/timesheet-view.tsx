'use client';

import { useMemo, useState } from 'react';

import { env } from '@/lib/config/env';
import { useTimesheet } from '@/hooks/use-timesheet';
import { useAuthStore } from '@/store/auth.store';

import { formatDuration } from './time-utils';

type DateRangeState = {
  date_from: string;
  date_to: string;
};

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20';

function formatDateRangeValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange(): DateRangeState {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    date_from: formatDateRangeValue(start),
    date_to: formatDateRangeValue(end),
  };
}

export function TimesheetView(): JSX.Element {
  const [range, setRange] = useState<DateRangeState>(getCurrentMonthRange);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useTimesheet(range);
  const accessToken = useAuthStore((state) => state.accessToken);

  const totalDays = useMemo(() => data?.days ?? [], [data]);
  const canExport = Boolean(range.date_from && range.date_to) && !isExporting;

  function buildExportUrl(): string {
    const searchParams = new URLSearchParams({
      date_from: range.date_from,
      date_to: range.date_to,
    });

    return `${env.apiUrl}/api/v1/time-entries/timesheet/export?${searchParams.toString()}`;
  }

  function getFilename(contentDisposition: string | null): string {
    if (!contentDisposition) return 'timesheet.xlsx';

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const basicMatch = contentDisposition.match(/filename="([^"]+)"/i);
    if (basicMatch?.[1]) {
      return basicMatch[1];
    }

    return 'timesheet.xlsx';
  }

  async function handleExport(): Promise<void> {
    if (!canExport) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch(buildExportUrl(), {
        method: 'GET',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (!response.ok) {
        throw new Error('Failed to export timesheet.');
      }

      const filename = getFilename(response.headers.get('Content-Disposition'));
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Failed to export timesheet.',
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              Range
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">Daily breakdown</h2>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-primary" htmlFor="timesheet-date-from">
                  From
                </label>
                <input
                  id="timesheet-date-from"
                  type="date"
                  value={range.date_from}
                  onChange={(event) => {
                    setRange((current) => ({ ...current, date_from: event.target.value }));
                    setExportError(null);
                  }}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-primary" htmlFor="timesheet-date-to">
                  To
                </label>
                <input
                  id="timesheet-date-to"
                  type="date"
                  value={range.date_to}
                  onChange={(event) => {
                    setRange((current) => ({ ...current, date_to: event.target.value }));
                    setExportError(null);
                  }}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={!canExport}
                className="inline-flex items-center justify-center rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </button>
              {exportError ? (
                <p role="alert" className="text-sm text-red-600">
                  {exportError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="panel p-6 md:p-8">
          <p className="text-sm text-text-secondary">Loading timesheet...</p>
        </section>
      ) : null}

      {isError ? (
        <section className="panel p-6 md:p-8">
          <p role="alert" className="text-sm text-red-600">
            {'message' in (error ?? {}) && typeof error?.message === 'string'
              ? error.message
              : 'Failed to load timesheet.'}
          </p>
        </section>
      ) : null}

      {!isLoading && !isError && data ? (
        <>
          <section className="panel p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              Summary
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-4xl font-semibold text-accent-700">
                {formatDuration(data.total_tracked_seconds)}
              </p>
              <p className="text-sm leading-6 text-text-secondary">
                Tracking from {data.date_from} to {data.date_to} across {totalDays.length} day
                {totalDays.length === 1 ? '' : 's'}.
              </p>
            </div>
          </section>

          <section className="panel p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              Days
            </p>
            {totalDays.length === 0 ? (
              <p className="mt-4 text-sm text-text-secondary">
                No tracked time for the selected range yet.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {totalDays.map((day) => (
                  <article
                    key={day.date}
                    className="rounded-2xl border border-border-subtle bg-surface-1 p-5"
                  >
                    <p className="text-sm font-semibold text-text-primary">{day.date}</p>
                    <p className="mt-3 text-2xl font-semibold text-accent-700">
                      {formatDuration(day.tracked_seconds)}
                    </p>
                    <p className="mt-2 text-sm text-text-secondary">
                      {day.entry_count} entr{day.entry_count === 1 ? 'y' : 'ies'}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
