'use client';

import type { MyDocumentEntry } from '@lumicore/shared-types';
import { AlertCircle, CheckCircle2, ExternalLink, FileCheck2 } from 'lucide-react';

import { useAcknowledgeDocument } from '@/hooks/use-acknowledge-document';
import { useMyDocuments } from '@/hooks/use-my-documents';
import { useTranslation } from '@/hooks/use-translation';

type DocumentGroup = {
  title: string;
  description: string;
  tone: 'danger' | 'default' | 'muted';
  documents: MyDocumentEntry[];
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('et-EE', { dateStyle: 'medium' }).format(new Date(value));
}

function DocumentSkeleton(): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="panel animate-pulse p-5">
          <div className="h-5 w-56 rounded bg-border-subtle" />
          <div className="mt-3 h-4 w-40 rounded bg-border-subtle" />
          <div className="mt-5 h-9 w-36 rounded-full bg-border-subtle" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: Readonly<{ onRetry: () => void }>): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="panel flex flex-col items-center gap-4 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <div>
        <p className="font-semibold text-text-primary">{t('docAck.failedToLoad')}</p>
        <p className="mt-1 text-sm text-text-secondary">{t('docAck.failedDescription')}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
      >
        {t('common.retry')}
      </button>
    </section>
  );
}

function EmptyState(): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="panel flex flex-col items-center gap-4 py-16 text-center">
      <FileCheck2 className="h-8 w-8 text-text-muted" />
      <div>
        <p className="font-semibold text-text-primary">{t('docAck.emptyTitle')}</p>
        <p className="mt-1 text-sm text-text-secondary">{t('docAck.emptyDescription')}</p>
      </div>
    </section>
  );
}

function DocumentCard({
  document,
  tone,
  disabled,
  onAcknowledge,
}: Readonly<{
  document: MyDocumentEntry;
  tone: DocumentGroup['tone'];
  disabled: boolean;
  onAcknowledge: (documentId: number) => void;
}>): JSX.Element {
  const { t } = useTranslation();
  const isAcknowledged = document.acknowledged;
  const borderTone =
    tone === 'danger'
      ? 'border-red-200 bg-red-50/60'
      : tone === 'muted'
        ? 'border-border-subtle bg-surface-1 opacity-80'
        : 'border-border-subtle bg-surface-1';

  return (
    <article className={`rounded-2xl border p-5 ${borderTone}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-text-primary">{document.title}</h3>
            <span className="pill text-xs">v{document.version}</span>
            {document.category ? <span className="pill text-xs">{document.category}</span> : null}
            {isAcknowledged ? (
              <span className="pill border-emerald-200 bg-emerald-50 text-xs text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('docAck.acknowledged')}
              </span>
            ) : null}
          </div>

          <div className="mt-3 space-y-1 text-sm text-text-secondary">
            {document.due_date && document.overdue ? (
              <p className="font-semibold text-red-600">
                {t('docAck.due')} {formatDate(document.due_date)} - {t('docAck.overdue')}
              </p>
            ) : null}
            {document.due_date && !document.overdue && !document.acknowledged ? (
              <p>{t('docAck.due')} {formatDate(document.due_date)}</p>
            ) : null}
            {document.acknowledged_at ? (
              <p>{t('docAck.acknowledged')} {formatDate(document.acknowledged_at)}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <a
            href={document.download_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            {t('docAck.openDocument')}
          </a>
          {!isAcknowledged ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAcknowledge(document.document_id)}
              className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {disabled ? t('docAck.acknowledging') : t('docAck.acknowledge')}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function DocumentGroupSection({
  group,
  disabled,
  onAcknowledge,
}: Readonly<{
  group: DocumentGroup;
  disabled: boolean;
  onAcknowledge: (documentId: number) => void;
}>): JSX.Element | null {
  if (group.documents.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{group.title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{group.description}</p>
      </div>
      <div className="space-y-3">
        {group.documents.map((document) => (
          <DocumentCard
            key={`${document.document_id}-${document.version}`}
            document={document}
            tone={group.tone}
            disabled={disabled}
            onAcknowledge={onAcknowledge}
          />
        ))}
      </div>
    </section>
  );
}

export function MyDocumentsInbox(): JSX.Element {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyDocuments();
  const { isAcknowledging, ackError, acknowledge } = useAcknowledgeDocument();

  async function handleAcknowledge(documentId: number): Promise<void> {
    const confirmed = window.confirm(t('docAck.confirmAcknowledge'));
    if (!confirmed) return;

    await acknowledge(documentId);
  }

  if (isLoading) return <DocumentSkeleton />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const documents = data ?? [];
  if (documents.length === 0) return <EmptyState />;

  const groups: DocumentGroup[] = [
    {
      title: t('docAck.groups.overdue.title'),
      description: t('docAck.groups.overdue.description'),
      tone: 'danger',
      documents: documents.filter((document) => document.overdue),
    },
    {
      title: t('docAck.groups.pending.title'),
      description: t('docAck.groups.pending.description'),
      tone: 'default',
      documents: documents.filter((document) => !document.acknowledged && !document.overdue),
    },
    {
      title: t('docAck.groups.acknowledged.title'),
      description: t('docAck.groups.acknowledged.description'),
      tone: 'muted',
      documents: documents.filter((document) => document.acknowledged),
    },
  ];

  return (
    <div className="space-y-6">
      {ackError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {ackError}
        </p>
      ) : null}

      {groups.map((group) => (
        <DocumentGroupSection
          key={group.title}
          group={group}
          disabled={isAcknowledging}
          onAcknowledge={(documentId) => void handleAcknowledge(documentId)}
        />
      ))}
    </div>
  );
}
