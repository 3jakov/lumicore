'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, AlertCircle } from 'lucide-react';
import type { TeamTimesheetRow } from '@lumicore/shared-types';

import { useTeamTimesheet } from '@/hooks/use-team-timesheet';
import { apiClient } from '@/lib/api-client';

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function monthBounds(year: number, month: number): { dateFrom: string; dateTo: string } {
  const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { dateFrom, dateTo };
}

function isWeekend(dateStr: string): boolean {
  const dow = new Date(dateStr + 'T12:00:00Z').getUTCDay();
  return dow === 0 || dow === 6;
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

function fmtHours(seconds: number): string {
  if (seconds === 0) return '';
  return (seconds / 3600).toFixed(2);
}

function fmtHoursAlways(seconds: number): string {
  return (seconds / 3600).toFixed(2);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <span
      className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

// ─── Month picker ─────────────────────────────────────────────────────────────

function MonthPicker({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  function prev() {
    if (month === 0) onChange(year - 1, 11);
    else onChange(year, month - 1);
  }
  function next() {
    if (month === 11) onChange(year + 1, 0);
    else onChange(year, month + 1);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-1 px-3 py-1.5 text-sm font-semibold text-text-primary">
      <button type="button" onClick={prev} className="p-0.5 hover:text-accent-700">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[130px] text-center">
        {MONTH_NAMES_RU[month]} {year}
      </span>
      <button type="button" onClick={next} className="p-0.5 hover:text-accent-700">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamTimesheetGrid(): JSX.Element {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [isExporting, setIsExporting] = useState(false);

  const { dateFrom, dateTo } = useMemo(() => monthBounds(year, month), [year, month]);
  const { data, isLoading, isError, refetch } = useTeamTimesheet(dateFrom, dateTo);

  async function handleExport() {
    setIsExporting(true);
    try {
      const blob = await apiClient.getBlob(
        `/time-entries/timesheet/export?date_from=${dateFrom}&date_to=${dateTo}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheet-${dateFrom}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  // ─── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="panel space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="h-9 w-44 animate-pulse rounded-full bg-border-subtle" />
          <div className="h-9 w-36 animate-pulse rounded-full bg-border-subtle" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-border-subtle" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <section className="panel flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div>
          <p className="font-semibold text-text-primary">Не удалось загрузить табель</p>
          <p className="mt-1 text-sm text-text-secondary">Проверьте соединение и попробуйте снова.</p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
        >
          Повторить
        </button>
      </section>
    );
  }

  const { dates, rows } = data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Экспорт...' : 'Экспорт в Excel'}
        </button>
      </div>

      {/* Grid */}
      <div className="panel overflow-x-auto p-0">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border-subtle">
              {/* Sticky employee column header */}
              <th className="sticky left-0 z-10 min-w-[180px] bg-surface-0 px-4 py-3 text-left text-xs font-semibold text-text-muted">
                Работники
              </th>
              {/* Day columns */}
              {dates.map((date) => {
                const weekend = isWeekend(date);
                const todayCol = isToday(date);
                const day = new Date(date + 'T12:00:00Z');
                const dayNum = day.getUTCDate();
                const dayName = DAY_NAMES_RU[day.getUTCDay()];
                return (
                  <th
                    key={date}
                    className={`min-w-[44px] px-1 py-2 text-center font-semibold ${
                      todayCol
                        ? 'bg-accent-50 text-accent-700'
                        : weekend
                        ? 'bg-surface-1 text-text-muted'
                        : 'text-text-secondary'
                    }`}
                  >
                    <div className="text-[10px] font-normal">{dayName}</div>
                    <div>{dayNum}</div>
                  </th>
                );
              })}
              {/* Summary columns */}
              <th className="min-w-[44px] px-2 py-3 text-center font-semibold text-text-secondary">РД</th>
              <th className="min-w-[52px] px-2 py-3 text-center font-semibold text-text-secondary">НЧ</th>
              <th className="min-w-[56px] px-2 py-3 text-center font-semibold text-text-secondary">СУ</th>
              <th className="min-w-[64px] px-2 py-3 text-center font-semibold text-text-primary">Всего</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: TeamTimesheetRow) => (
              <TimesheetRow key={row.employee_id} row={row} dates={dates} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={dates.length + 5}
                  className="px-4 py-12 text-center text-sm text-text-muted"
                >
                  Нет сотрудников
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Single employee row ──────────────────────────────────────────────────────

function TimesheetRow({
  row,
  dates,
}: {
  row: TeamTimesheetRow;
  dates: string[];
}): JSX.Element {
  const overtimeSeconds = row.overtime_seconds;
  const overtimeHours = fmtHoursAlways(Math.abs(overtimeSeconds));
  const overtimeSign = overtimeSeconds >= 0 ? '+' : '-';
  const overtimeClass = overtimeSeconds < 0 ? 'text-red-600 font-semibold' : 'text-text-primary';

  return (
    <tr className="border-b border-border-subtle last:border-0 hover:bg-surface-1/50">
      {/* Sticky employee name */}
      <td className="sticky left-0 z-10 bg-surface-0 px-4 py-2">
        <div className="flex items-center gap-2">
          <Avatar initials={row.initials} color={row.avatar_color} />
          <span className="truncate text-xs font-medium text-text-primary">{row.employee_name}</span>
        </div>
      </td>
      {/* Day cells */}
      {dates.map((date) => {
        const seconds = row.day_seconds[date] ?? 0;
        const weekend = isWeekend(date);
        const todayCol = isToday(date);
        return (
          <td
            key={date}
            className={`px-1 py-2 text-center tabular-nums ${
              todayCol
                ? 'bg-accent-50 text-accent-700'
                : weekend
                ? 'bg-surface-1 text-text-muted'
                : 'text-text-secondary'
            }`}
          >
            {fmtHours(seconds)}
          </td>
        );
      })}
      {/* Summary */}
      <td className="px-2 py-2 text-center tabular-nums text-text-secondary">{row.working_days}</td>
      <td className="px-2 py-2 text-center tabular-nums text-text-secondary">
        {fmtHoursAlways(row.norm_seconds)}
      </td>
      <td className={`px-2 py-2 text-center tabular-nums ${overtimeClass}`}>
        {overtimeSign}{overtimeHours}
      </td>
      <td className="px-2 py-2 text-center font-semibold tabular-nums text-text-primary">
        {fmtHoursAlways(row.total_seconds)}
      </td>
    </tr>
  );
}
