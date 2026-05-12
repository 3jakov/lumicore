'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AbsenceType, type CreateAbsenceDto } from '@lumicore/shared-types';
import { Loader2, X } from 'lucide-react';

import { useCreateAbsence } from '@/hooks/use-absences';
import { useTranslation } from '@/hooks/use-translation';
import { ABSENCE_DISPLAY } from '@/lib/absences/absence-display';

type AbsenceFormModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  defaultEmployeeId?: number;
  defaultDate?: string;
  employees: { id: number; full_name: string }[];
}>;

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';
const textAreaCls = `${inputCls} min-h-24 resize-y`;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AbsenceFormModal({
  open,
  onClose,
  defaultEmployeeId,
  defaultDate,
  employees,
}: AbsenceFormModalProps): JSX.Element | null {
  const { t } = useTranslation();
  const createAbsence = useCreateAbsence();
  const initialDate = defaultDate ?? todayString();
  const firstEmployeeId = employees[0]?.id;

  const [employeeId, setEmployeeId] = useState(defaultEmployeeId ?? firstEmployeeId ?? 0);
  const [type, setType] = useState<AbsenceType>(AbsenceType.SvobodnyiDen);
  const [dateFrom, setDateFrom] = useState(initialDate);
  const [dateTo, setDateTo] = useState(initialDate);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) return;

    const nextDate = defaultDate ?? todayString();
    setEmployeeId(defaultEmployeeId ?? employees[0]?.id ?? 0);
    setType(AbsenceType.SvobodnyiDen);
    setDateFrom(nextDate);
    setDateTo(nextDate);
    setComment('');
  }, [defaultDate, defaultEmployeeId, employees, open]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !createAbsence.isPending) {
        onClose();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [createAbsence.isPending, onClose, open]);

  const absenceTypes = useMemo(() => Object.values(AbsenceType), []);
  const canSubmit = employeeId > 0 && Boolean(dateFrom && dateTo) && !createAbsence.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const payload: CreateAbsenceDto = {
      employee_id: employeeId,
      type,
      date_from: dateFrom,
      date_to: dateTo,
      comment: comment.trim() || undefined,
    };

    await createAbsence.mutateAsync(payload);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (!createAbsence.isPending) onClose();
        }}
      />

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{t('absences.add')}</h2>
            <p className="mt-1 text-sm text-text-secondary">{t('absences.description')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={createAbsence.isPending}
            className="rounded-full p-2 text-text-muted transition hover:bg-surface-1 hover:text-text-primary disabled:opacity-50"
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5">
          <div className="space-y-1.5">
            <label htmlFor="absence-employee" className="text-sm font-medium text-text-secondary">
              {t('absences.employee')}
            </label>
            <select
              id="absence-employee"
              value={employeeId ? String(employeeId) : ''}
              onChange={(event) => setEmployeeId(Number(event.target.value))}
              disabled={createAbsence.isPending}
              className={inputCls}
              required
            >
              {employees.length === 0 && <option value="">{t('absences.noEmployees')}</option>}
              {employees.map((employee) => (
                <option key={employee.id} value={String(employee.id)}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="absence-type" className="text-sm font-medium text-text-secondary">
              {t('absences.type')}
            </label>
            <select
              id="absence-type"
              value={type}
              onChange={(event) => setType(event.target.value as AbsenceType)}
              disabled={createAbsence.isPending}
              className={inputCls}
            >
              {absenceTypes.map((absenceType) => {
                const display = ABSENCE_DISPLAY[absenceType];
                return (
                  <option key={absenceType} value={absenceType}>
                    {display.code} {display.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="absence-date-from" className="text-sm font-medium text-text-secondary">
                {t('absences.dateFrom')}
              </label>
              <input
                id="absence-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                disabled={createAbsence.isPending}
                className={inputCls}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="absence-date-to" className="text-sm font-medium text-text-secondary">
                {t('absences.dateTo')}
              </label>
              <input
                id="absence-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                disabled={createAbsence.isPending}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="absence-comment" className="text-sm font-medium text-text-secondary">
              {t('absences.comment')}
            </label>
            <textarea
              id="absence-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={createAbsence.isPending}
              className={textAreaCls}
            />
          </div>

          {createAbsence.isError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {t('absences.failedToSave')}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-subtle px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={createAbsence.isPending}
            className="rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:opacity-50"
          >
            {t('absences.cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50"
          >
            {createAbsence.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {createAbsence.isPending ? t('common.saving') : t('absences.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
