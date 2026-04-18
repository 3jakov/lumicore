'use client';

import type { RoleSummary } from '@lumicore/shared-types';
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useCreateRole } from '@/hooks/use-create-role';
import { useDeleteRole } from '@/hooks/use-delete-role';
import { useRoles } from '@/hooks/use-roles';
import { useUpdateRole } from '@/hooks/use-update-role';
import { useAuthStore } from '@/store/auth.store';

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat('et-EE', { dateStyle: 'medium' }).format(new Date(value));
}

function RolesLoadingState(): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="panel animate-pulse p-4">
          <div className="h-5 w-40 rounded bg-border-subtle" />
          <div className="mt-3 h-4 w-28 rounded bg-border-subtle" />
        </div>
      ))}
    </div>
  );
}

export function RolesSettings(): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const { data, isLoading, isError, refetch } = useRoles();
  const { isLoading: isCreating, error: createError, createRole } = useCreateRole();
  const { isLoading: isUpdating, error: updateError, updateRole } = useUpdateRole();
  const { isLoading: isDeleting, error: deleteError, deleteRole } = useDeleteRole();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const roles = data ?? [];
  const mutationError = createError ?? updateError ?? deleteError;
  const isMutating = isCreating || isUpdating || isDeleting;

  async function handleCreate(): Promise<void> {
    const trimmedName = newRoleName.trim();
    if (!trimmedName) return;

    const created = await createRole({ name: trimmedName });
    if (created) {
      setNewRoleName('');
      setIsAdding(false);
    }
  }

  async function handleUpdate(role: RoleSummary): Promise<void> {
    const trimmedName = draftName.trim();

    if (!trimmedName || trimmedName === role.name) {
      setEditingId(null);
      setDraftName('');
      return;
    }

    const updated = await updateRole(role.id, { name: trimmedName });
    if (updated) {
      setEditingId(null);
      setDraftName('');
    }
  }

  async function handleDelete(roleId: number): Promise<void> {
    if (!window.confirm('Delete this role?')) return;
    await deleteRole(roleId);
  }

  if (isLoading) return <RolesLoadingState />;

  if (isError) {
    return (
      <section className="panel flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div>
          <p className="font-semibold text-text-primary">Failed to load roles</p>
          <p className="mt-1 text-sm text-text-secondary">
            Try again to reload the current role configuration.
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

  return (
    <section className={`space-y-4 ${isMutating ? 'opacity-50 pointer-events-none' : ''}`}>
      {mutationError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {mutationError}
        </p>
      ) : null}

      {roles.length === 0 ? (
        <div className="panel py-12 text-center">
          <p className="font-semibold text-text-primary">No roles configured</p>
          <p className="mt-1 text-sm text-text-secondary">
            Roles will appear here once they are created.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => {
            const isEditing = editingId === role.id;

            return (
              <div key={role.id} className="panel flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      onBlur={() => void handleUpdate(role)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void handleUpdate(role);
                        }
                        if (event.key === 'Escape') {
                          setEditingId(null);
                          setDraftName('');
                        }
                      }}
                      className={inputCls}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => {
                          if (!isAdmin) return;
                          setEditingId(role.id);
                          setDraftName(role.name);
                        }}
                        className={`text-left text-lg font-semibold text-text-primary ${
                          isAdmin ? 'transition hover:text-accent-700' : ''
                        }`}
                      >
                        {role.name}
                      </button>
                      <p className="mt-1 text-sm text-text-secondary">
                        Created {formatCreatedAt(role.created_at)}
                      </p>
                    </>
                  )}
                </div>

                {isAdmin && !isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(role.id);
                        setDraftName(role.name);
                      }}
                      className="rounded-full border border-border-subtle bg-surface-1 p-2 text-text-secondary transition hover:border-border-strong hover:text-text-primary"
                      aria-label={`Edit ${role.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => void handleDelete(role.id)}
                      className="rounded-full border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                      aria-label={`Delete ${role.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {isAdmin ? (
        <div className="panel p-4">
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800"
            >
              <Plus className="h-4 w-4" />
              Add role
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                autoFocus
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                onBlur={() => {
                  if (!newRoleName.trim()) {
                    setIsAdding(false);
                    setNewRoleName('');
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleCreate();
                  }
                  if (event.key === 'Escape') {
                    setIsAdding(false);
                    setNewRoleName('');
                  }
                }}
                placeholder="Role name"
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewRoleName('');
                  }}
                  className="rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
