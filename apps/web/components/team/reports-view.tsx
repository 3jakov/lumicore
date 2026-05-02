'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { ReportSummaryRow, ReportDetailRow } from '@lumicore/shared-types';

import { useReportSummary } from '@/hooks/use-report-summary';
import { useReportDetailed } from '@/hooks/use-report-detailed';

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function monthBounds(year: number, month: number) {
  const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { dateFrom, dateTo };
}

function fmtHours(seconds: number): string {
  return (seconds / 3600).toFixed(2);
}

function fmtDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}ч ${String(m).padStart(2, '0')}м`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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

function MonthPicker({
  year, month, onChange,
}: { year: number; month: number; onChange: (y: number, m: number) => void }) {
  function prev() { month === 0 ? onChange(year - 1, 11) : onChange(year, month - 1); }
  function next() { month === 11 ? onChange(year + 1, 0) : onChange(year, month + 1); }
  return (
    <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-1 px-3 py-1.5 text-sm font-semibold text-text-primary">
      <button type="button" onClick={prev} className="p-0.5 hover:text-accent-700">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[130px] text-center">{MONTH_NAMES_RU[month]} {year}</span>
      <button type="button" onClick={next} className="p-0.5 hover:text-accent-700">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="panel flex flex-col items-center gap-4 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="font-semibold text-text-primary">Не удалось загрузить данные</p>
      <button type="button" onClick={onRetry}
        className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary">
        Повторить
      </button>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="panel space-y-3 p-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-border-subtle" />
      ))}
    </div>
  );
}

// ─── Summary tab ──────────────────────────────────────────────────────────────

function SummaryTab({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const { data, isLoading, isError, refetch } = useReportSummary(dateFrom, dateTo);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return null;

  const total = data.rows.reduce((s, r) => s + r.total_seconds, 0);

  return (
    <div className="panel overflow-x-auto p-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Сотрудник</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Группа</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Записей</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Норма, ч</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Факт, ч</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Сверхурочные</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row: ReportSummaryRow) => {
            const ot = row.overtime_seconds;
            const otClass = ot < 0 ? 'text-red-600 font-semibold' : ot > 0 ? 'text-green-600' : 'text-text-muted';
            const otSign = ot >= 0 ? '+' : '';
            return (
              <tr key={row.employee_id} className="border-b border-border-subtle last:border-0 hover:bg-surface-1/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar initials={row.initials} color={row.avatar_color} />
                    <span className="font-medium text-text-primary">{row.employee_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{row.group}</td>
                <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{row.entry_count}</td>
                <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{fmtHours(row.norm_seconds)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-text-primary">{fmtHours(row.total_seconds)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${otClass}`}>
                  {otSign}{fmtHours(Math.abs(ot))}
                </td>
              </tr>
            );
          })}
          {/* Total row */}
          <tr className="border-t-2 border-border-strong bg-surface-1">
            <td className="px-4 py-3 font-semibold text-text-primary" colSpan={4}>Итого</td>
            <td className="px-4 py-3 text-right tabular-nums font-bold text-text-primary">{fmtHours(total)}</td>
            <td className="px-4 py-3" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Detailed tab ─────────────────────────────────────────────────────────────

function DetailedTab({
  dateFrom, dateTo, unassignedOnly = false,
}: { dateFrom: string; dateTo: string; unassignedOnly?: boolean }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useReportDetailed({
    dateFrom, dateTo, unassignedOnly, page, limit: 50,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return null;

  const totalPages = Math.ceil(data.meta.total / data.meta.limit);

  return (
    <div className="space-y-3">
      <div className="panel overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Дата</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Сотрудник</th>
              {!unassignedOnly && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Проект</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Задача</th>
                </>
              )}
              {unassignedOnly && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Причина</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Начало</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Конец</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted">Длительность</th>
              {!unassignedOnly && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted">Ручная</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.data.map((row: ReportDetailRow) => (
              <tr key={row.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-1/50">
                <td className="px-4 py-2.5 text-text-secondary">{fmtDate(row.started_at)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar initials={row.initials} color={row.avatar_color} />
                    <span className="text-text-primary">{row.employee_name}</span>
                  </div>
                </td>
                {!unassignedOnly && (
                  <>
                    <td className="px-4 py-2.5 text-text-secondary">{row.project_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{row.task_name ?? '—'}</td>
                  </>
                )}
                {unassignedOnly && (
                  <td className="max-w-xs px-4 py-2.5 text-text-secondary">
                    <span className="truncate block" title={row.no_project_reason ?? ''}>
                      {row.no_project_reason ?? '—'}
                    </span>
                  </td>
                )}
                <td className="px-4 py-2.5 tabular-nums text-text-secondary">{fmtTime(row.started_at)}</td>
                <td className="px-4 py-2.5 tabular-nums text-text-secondary">
                  {row.ended_at ? fmtTime(row.ended_at) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium text-text-primary">
                  {fmtDuration(row.duration_seconds)}
                </td>
                {!unassignedOnly && (
                  <td className="px-4 py-2.5 text-center text-text-muted">
                    {row.is_manual ? '✓' : ''}
                  </td>
                )}
              </tr>
            ))}
            {data.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-muted">
                  Нет записей за выбранный период
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Всего: {data.meta.total} записей</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="pill disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="pill disabled:opacity-40">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ReportTab = 'summary' | 'detailed' | 'unassigned';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'summary', label: 'Сводная' },
  { id: 'detailed', label: 'Детальная' },
  { id: 'unassigned', label: 'Незакреплённая' },
];

export function ReportsView(): JSX.Element {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');

  const { dateFrom, dateTo } = useMemo(() => monthBounds(year, month), [year, month]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pill transition ${
                activeTab === tab.id
                  ? 'border-accent-200 bg-accent-50 text-accent-700'
                  : 'hover:border-border-strong hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'summary' && <SummaryTab dateFrom={dateFrom} dateTo={dateTo} />}
      {activeTab === 'detailed' && <DetailedTab dateFrom={dateFrom} dateTo={dateTo} />}
      {activeTab === 'unassigned' && <DetailedTab dateFrom={dateFrom} dateTo={dateTo} unassignedOnly />}
    </div>
  );
}
