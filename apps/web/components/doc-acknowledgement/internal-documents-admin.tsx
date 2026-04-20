'use client';

import type {
  AssignDocumentDto,
  DocAckStatus,
  DocumentStatusSummary,
  EmployeeAckStatus,
  InternalDocumentSummary,
} from '@lumicore/shared-types';
import { EmployeeGroup } from '@lumicore/shared-types';
import { AlertCircle, Archive, FileText, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';

import { useArchiveInternalDocument } from '@/hooks/use-archive-internal-document';
import { useAssignDocument } from '@/hooks/use-assign-document';
import { useCreateInternalDocument } from '@/hooks/use-create-internal-document';
import { useDocumentStatus } from '@/hooks/use-document-status';
import { useEmployees } from '@/hooks/use-employees';
import { useInternalDocuments } from '@/hooks/use-internal-documents';
import { useUpdateInternalDocument } from '@/hooks/use-update-internal-document';
import { useAuthStore } from '@/store/auth.store';

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

type DocumentFormState = {
  title: string;
  description: string;
  category: string;
  requiresAck: boolean;
  file: File | null;
};

const emptyFormState: DocumentFormState = {
  title: '',
  description: '',
  category: '',
  requiresAck: true,
  file: null,
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('et-EE', { dateStyle: 'medium' }).format(new Date(value));
}

function statusTone(status: DocAckStatus): string {
  if (status === 'acknowledged') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'overdue') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function InternalDocumentsLoading(): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="panel animate-pulse p-5">
          <div className="h-5 w-64 rounded bg-border-subtle" />
          <div className="mt-3 h-4 w-40 rounded bg-border-subtle" />
        </div>
      ))}
    </div>
  );
}

function InlineDocumentForm({
  mode,
  initial,
  isLoading,
  error,
  onCancel,
  onSubmit,
}: Readonly<{
  mode: 'create' | 'edit';
  initial: DocumentFormState;
  isLoading: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (state: DocumentFormState) => Promise<boolean>;
}>): JSX.Element {
  const [state, setState] = useState<DocumentFormState>(initial);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const trimmedTitle = state.title.trim();
    if (!trimmedTitle) return;
    if (mode === 'create' && !state.file) return;

    const saved = await onSubmit({
      ...state,
      title: trimmedTitle,
      description: state.description.trim(),
      category: state.category.trim(),
    });

    if (saved) {
      setState(emptyFormState);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={`panel space-y-4 p-5 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          {mode === 'create' ? 'New document' : 'Edit document'}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-text-primary">
          {mode === 'create' ? 'Add internal document' : 'Update internal document'}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-text-primary">Title</span>
          <input
            value={state.title}
            onChange={(event) => setState((current) => ({ ...current, title: event.target.value }))}
            className={inputCls}
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-text-primary">Category</span>
          <input
            value={state.category}
            onChange={(event) =>
              setState((current) => ({ ...current, category: event.target.value }))
            }
            className={inputCls}
          />
        </label>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-semibold text-text-primary">Description</span>
        <textarea
          value={state.description}
          onChange={(event) =>
            setState((current) => ({ ...current, description: event.target.value }))
          }
          className={`${inputCls} min-h-24 resize-y`}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <input
            type="checkbox"
            checked={state.requiresAck}
            onChange={(event) =>
              setState((current) => ({ ...current, requiresAck: event.target.checked }))
            }
            className="h-4 w-4 rounded border-border-subtle"
          />
          <span className="text-sm font-semibold text-text-primary">Requires acknowledgement</span>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-text-primary">
            File {mode === 'create' ? '(required)' : '(optional new version)'}
          </span>
          <input
            type="file"
            onChange={(event) =>
              setState((current) => ({ ...current, file: event.target.files?.[0] ?? null }))
            }
            required={mode === 'create'}
            className={inputCls}
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isLoading || !state.title.trim() || (mode === 'create' && !state.file)}
          className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create document' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ComplianceMatrix({
  documentId,
}: Readonly<{ documentId: number }>): JSX.Element {
  const { data, isLoading, isError, refetch } = useDocumentStatus(documentId);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4 text-sm text-text-secondary">
        Loading compliance status...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <p className="font-semibold text-red-700">Failed to load compliance status</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const status = data as DocumentStatusSummary | undefined;
  const assignments = status?.assignments ?? [];

  if (assignments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 p-4 text-sm text-text-secondary">
        No employees assigned yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface-1">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-brand-50 text-xs uppercase tracking-[0.16em] text-text-muted">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Acknowledged</th>
            <th className="px-4 py-3">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {assignments.map((assignment: EmployeeAckStatus) => (
            <tr key={assignment.employee_id}>
              <td className="px-4 py-3 font-medium text-text-primary">
                {assignment.employee_name}
              </td>
              <td className="px-4 py-3">
                <span className={`pill ${statusTone(assignment.status)}`}>
                  {assignment.status}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {formatDate(assignment.acknowledged_at)}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {formatDate(assignment.due_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignmentForm({ documentId }: Readonly<{ documentId: number }>): JSX.Element {
  const employeesQuery = useEmployees();
  const { isAssigning, assignError, assignDocument } = useAssignDocument();
  const [employeeIds, setEmployeeIds] = useState<number[]>([]);
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [dueDate, setDueDate] = useState('');

  async function handleAssign(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (employeeIds.length === 0 && groups.length === 0) return;

    const dto: AssignDocumentDto = {
      ...(employeeIds.length > 0 ? { employee_ids: employeeIds } : {}),
      ...(groups.length > 0 ? { groups } : {}),
      ...(dueDate ? { due_date: dueDate } : {}),
    };

    const assigned = await assignDocument(documentId, dto);
    if (assigned) {
      setEmployeeIds([]);
      setGroups([]);
      setDueDate('');
    }
  }

  const employees = employeesQuery.data?.data ?? [];
  const groupValues = Object.values(EmployeeGroup);

  return (
    <form
      onSubmit={(event) => void handleAssign(event)}
      className={`rounded-2xl border border-border-subtle bg-surface-1 p-4 ${isAssigning ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <h3 className="font-semibold text-text-primary">Assign document</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">Employees</p>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border-subtle bg-white p-3">
            {employeesQuery.isLoading ? <p className="text-sm text-text-secondary">Loading employees...</p> : null}
            {!employeesQuery.isLoading && employees.length === 0 ? (
              <p className="text-sm text-text-secondary">No employees found.</p>
            ) : null}
            {employees.map((employee) => (
              <label key={employee.id} className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={employeeIds.includes(employee.id)}
                  onChange={(event) =>
                    setEmployeeIds((current) =>
                      event.target.checked
                        ? [...current, employee.id]
                        : current.filter((id) => id !== employee.id),
                    )
                  }
                  className="h-4 w-4 rounded border-border-subtle"
                />
                {employee.full_name}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">Groups</p>
            <div className="mt-2 grid gap-2 rounded-xl border border-border-subtle bg-white p-3 sm:grid-cols-2">
              {groupValues.map((group) => (
                <label key={group} className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={groups.includes(group)}
                    onChange={(event) =>
                      setGroups((current) =>
                        event.target.checked
                          ? [...current, group]
                          : current.filter((value) => value !== group),
                      )
                    }
                    className="h-4 w-4 rounded border-border-subtle"
                  />
                  {group}
                </label>
              ))}
            </div>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-text-primary">Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={inputCls}
            />
          </label>
        </div>
      </div>

      {assignError ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {assignError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isAssigning || (employeeIds.length === 0 && groups.length === 0)}
        className="mt-4 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAssigning ? 'Assigning...' : 'Assign'}
      </button>
    </form>
  );
}

function DocumentExpansion({ documentId }: Readonly<{ documentId: number }>): JSX.Element {
  return (
    <div className="space-y-4 border-t border-border-subtle p-5">
      <ComplianceMatrix documentId={documentId} />
      <AssignmentForm documentId={documentId} />
    </div>
  );
}

export function InternalDocumentsAdmin(): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const { data, isLoading, isError, refetch } = useInternalDocuments();
  const { isCreating, createError, createDocument } = useCreateInternalDocument();
  const { isUpdating, updateError, updateDocument } = useUpdateInternalDocument();
  const { isArchiving, archiveError, archiveDocument } = useArchiveInternalDocument();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!isAdmin) {
    return (
      <section className="panel p-8">
        <p className="font-semibold text-text-primary">Access restricted.</p>
        <p className="mt-1 text-sm text-text-secondary">
          This page is available to administrators only.
        </p>
      </section>
    );
  }

  if (isLoading) return <InternalDocumentsLoading />;

  if (isError) {
    return (
      <section className="panel flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div>
          <p className="font-semibold text-text-primary">Failed to load internal documents</p>
          <p className="mt-1 text-sm text-text-secondary">
            Try again to reload acknowledgement documents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
        >
          Retry
        </button>
      </section>
    );
  }

  const documents = data ?? [];
  const mutationError = createError ?? updateError ?? archiveError;

  async function handleArchive(document: InternalDocumentSummary): Promise<void> {
    if (!window.confirm(`Archive ${document.title}?`)) return;
    await archiveDocument(document.id);
    if (expandedId === document.id) setExpandedId(null);
    if (editingId === document.id) setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {mutationError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {mutationError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800"
        >
          <Plus className="h-4 w-4" />
          Add document
        </button>
      </div>

      {showCreateForm ? (
        <InlineDocumentForm
          mode="create"
          initial={emptyFormState}
          isLoading={isCreating}
          error={createError}
          onCancel={() => setShowCreateForm(false)}
          onSubmit={async (state) => {
            if (!state.file) return false;
            const created = await createDocument(state.file, {
              title: state.title,
              ...(state.description ? { description: state.description } : {}),
              ...(state.category ? { category: state.category } : {}),
              requires_ack: state.requiresAck,
            });
            if (created) setShowCreateForm(false);
            return created !== null;
          }}
        />
      ) : null}

      {documents.length === 0 ? (
        <section className="panel py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-text-muted" />
          <p className="mt-3 font-semibold text-text-primary">No internal documents yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Add a document before assigning acknowledgement requirements.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => {
            const isExpanded = expandedId === document.id;
            const isEditing = editingId === document.id;

            return (
              <section key={document.id} className="panel overflow-hidden">
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedId((current) => (current === document.id ? null : document.id))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-text-primary">{document.title}</h2>
                      <span className="pill text-xs">v{document.version}</span>
                      {document.category ? <span className="pill text-xs">{document.category}</span> : null}
                      <span className="pill text-xs">
                        {document.requires_ack ? 'Requires ack' : 'No ack required'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">
                      Created {formatDate(document.created_at)}
                    </p>
                  </button>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId((current) => (current === document.id ? null : document.id))}
                      className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isArchiving}
                      onClick={() => void handleArchive(document)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="border-t border-border-subtle p-5">
                    <InlineDocumentForm
                      mode="edit"
                      initial={{
                        title: document.title,
                        description: document.description ?? '',
                        category: document.category ?? '',
                        requiresAck: document.requires_ack,
                        file: null,
                      }}
                      isLoading={isUpdating}
                      error={updateError}
                      onCancel={() => setEditingId(null)}
                      onSubmit={async (state) => {
                        const updated = await updateDocument(
                          document.id,
                          {
                            title: state.title,
                            description: state.description || undefined,
                            category: state.category || undefined,
                            requires_ack: state.requiresAck,
                          },
                          state.file,
                        );
                        if (updated) setEditingId(null);
                        return updated !== null;
                      }}
                    />
                  </div>
                ) : null}

                {isExpanded ? <DocumentExpansion documentId={document.id} /> : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
