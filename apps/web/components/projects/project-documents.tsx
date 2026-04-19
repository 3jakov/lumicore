'use client';

import type { DocumentSummary } from '@lumicore/shared-types';
import { AlertCircle, Download, FileText, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';

import { useDeleteDocument } from '@/hooks/use-delete-document';
import { useDocuments } from '@/hooks/use-documents';
import { useUploadDocument } from '@/hooks/use-upload-document';

type ProjectDocumentsProps = Readonly<{
  projectId: number;
}>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatUploadedAt(value: string): string {
  return new Intl.DateTimeFormat('et-EE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function DocumentsLoadingState(): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <div className="flex animate-pulse items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-border-subtle" />
            <div className="flex-1">
              <div className="h-5 w-56 rounded bg-border-subtle" />
              <div className="mt-2 h-4 w-36 rounded bg-border-subtle" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentsErrorState({ onRetry }: Readonly<{ onRetry: () => void }>): JSX.Element {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
        <div>
          <p className="font-semibold text-red-700">Failed to load documents</p>
          <p className="mt-1 text-sm text-red-600">
            Try again to reload files attached to this project.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentRow({
  document,
  onDelete,
  disabled,
}: Readonly<{
  document: DocumentSummary;
  onDelete: (document: DocumentSummary) => void;
  disabled: boolean;
}>): JSX.Element {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-text-primary">{document.original_filename}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {formatFileSize(document.file_size_bytes)} · Uploaded {formatUploadedAt(document.uploaded_at)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={document.download_url}
            download={document.original_filename}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDelete(document)}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data, isLoading, isError, refetch } = useDocuments(projectId);
  const { isUploading, uploadError, uploadDocument } = useUploadDocument();
  const { isDeleting, deleteError, deleteDocument } = useDeleteDocument();

  async function handleFileSelected(file: File | undefined): Promise<void> {
    if (!file) return;
    await uploadDocument(file, projectId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleDelete(document: DocumentSummary): Promise<void> {
    const confirmed = window.confirm(`Delete ${document.original_filename}?`);
    if (!confirmed) return;

    await deleteDocument(document.id, projectId);
  }

  const documents = data ?? [];
  const error = uploadError ?? deleteError;

  return (
    <section className="panel p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
            Project files
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">Documents</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Upload and manage files attached to this project.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            className="hidden"
            onChange={(event) => void handleFileSelected(event.target.files?.[0])}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload document'}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        {isLoading ? <DocumentsLoadingState /> : null}
        {isError ? <DocumentsErrorState onRetry={() => void refetch()} /> : null}
        {!isLoading && !isError && documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 px-4 py-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-3 font-semibold text-text-primary">
              No documents attached to this project yet.
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Upload contracts, plans, or handover files when they are ready.
            </p>
          </div>
        ) : null}
        {!isLoading && !isError && documents.length > 0 ? (
          <div className={`space-y-3 ${isUploading || isDeleting ? 'opacity-60' : ''}`}>
            {documents.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                onDelete={(doc) => void handleDelete(doc)}
                disabled={isDeleting}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
