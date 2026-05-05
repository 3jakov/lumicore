'use client';

import { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

import { useDeleteAbsence } from '@/hooks/use-absences';
import { useTranslation } from '@/hooks/use-translation';

type Props = Readonly<{
  open: boolean;
  absenceId: number;
  code: string;
  onClose: () => void;
}>;

export function AbsenceDeleteModal({
  open,
  absenceId,
  code,
  onClose,
}: Props): JSX.Element | null {
  const { t } = useTranslation();
  const deleteAbsence = useDeleteAbsence();

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deleteAbsence.isPending) {
        onClose();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteAbsence.isPending, onClose, open]);

  async function handleDelete() {
    await deleteAbsence.mutateAsync(absenceId);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (!deleteAbsence.isPending) onClose();
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border-subtle bg-surface-0 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{t('absences.deleteTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {t('absences.deleteConfirm')}{' '}
              <span className="font-semibold text-text-primary">{code}</span>?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleteAbsence.isPending}
            className="rounded-full p-2 text-text-muted transition hover:bg-surface-1 hover:text-text-primary disabled:opacity-50"
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteAbsence.isPending}
            className="rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:opacity-50"
          >
            {t('absences.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleteAbsence.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleteAbsence.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleteAbsence.isPending ? t('absences.deleting') : t('absences.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
