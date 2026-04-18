'use client';

import type { TagSummary } from '@lumicore/shared-types';
import { TagEntityType } from '@lumicore/shared-types';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useCreateTag } from '@/hooks/use-create-tag';
import { useDeleteTag } from '@/hooks/use-delete-tag';
import { useProjectTags, useTaskTags } from '@/hooks/use-tags';
import { useUpdateTag } from '@/hooks/use-update-tag';
import { useAuthStore } from '@/store/auth.store';

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

type TagSectionProps = {
  entityType: TagEntityType;
  title: string;
  tags: TagSummary[];
  isAdmin: boolean;
};

function TagsLoadingState(): JSX.Element {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="panel animate-pulse p-5">
          <div className="h-5 w-32 rounded bg-border-subtle" />
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((__, pillIndex) => (
              <div key={pillIndex} className="h-10 w-24 rounded-full bg-border-subtle" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TagSection({ entityType, title, tags, isAdmin }: Readonly<TagSectionProps>): JSX.Element {
  const { isLoading: isCreating, error: createError, createTag } = useCreateTag();
  const { isLoading: isUpdating, error: updateError, updateTag } = useUpdateTag();
  const { isLoading: isDeleting, error: deleteError, deleteTag } = useDeleteTag();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState('#2563eb');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#2563eb');
  const [isAdding, setIsAdding] = useState(false);

  const error = createError ?? updateError ?? deleteError;
  const isMutating = isCreating || isUpdating || isDeleting;

  async function handleCreate(): Promise<void> {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const created = await createTag({
      name: trimmedName,
      entity_type: entityType,
      color: newColor,
    });

    if (created) {
      setNewName('');
      setNewColor('#2563eb');
      setIsAdding(false);
    }
  }

  async function handleUpdate(tag: TagSummary): Promise<void> {
    const trimmedName = draftName.trim();
    const nameChanged = trimmedName !== tag.name;
    const colorChanged = draftColor !== tag.color;

    if (!trimmedName) {
      setEditingId(null);
      setDraftName('');
      setDraftColor('#2563eb');
      return;
    }

    if (!nameChanged && !colorChanged) {
      setEditingId(null);
      setDraftName('');
      setDraftColor('#2563eb');
      return;
    }

    const updated = await updateTag(tag.id, entityType, {
      ...(nameChanged ? { name: trimmedName } : {}),
      ...(colorChanged ? { color: draftColor } : {}),
    });

    if (updated) {
      setEditingId(null);
      setDraftName('');
      setDraftColor('#2563eb');
    }
  }

  return (
    <section className={`panel space-y-4 p-5 ${isMutating ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {entityType === TagEntityType.project
              ? 'Tags used to categorise project records.'
              : 'Tags used to categorise task records.'}
          </p>
        </div>
        {isAdmin && !isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-text-inverse transition hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" />
            Add tag
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {isAdding ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              autoFocus
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Tag name"
              className={inputCls}
            />
            <input
              type="color"
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              className="h-12 w-16 rounded-xl border border-border-subtle bg-surface-1 p-2"
            />
          </div>
          <div className="mt-3 flex gap-2">
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
                setNewName('');
                setNewColor('#2563eb');
              }}
              className="rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {tags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 px-4 py-8 text-center text-sm text-text-secondary">
          No tags configured for this entity type yet.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => {
            const isEditing = editingId === tag.id;

            if (isEditing) {
              return (
                <div key={tag.id} className="min-w-[16rem] rounded-2xl border border-border-subtle bg-surface-1 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      autoFocus
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      onBlur={() => void handleUpdate(tag)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void handleUpdate(tag);
                        }
                        if (event.key === 'Escape') {
                          setEditingId(null);
                          setDraftName('');
                          setDraftColor('#2563eb');
                        }
                      }}
                      className={inputCls}
                    />
                    <input
                      type="color"
                      value={draftColor}
                      onChange={(event) => setDraftColor(event.target.value)}
                      className="h-12 w-16 rounded-xl border border-border-subtle bg-surface-1 p-2"
                    />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tag.id}
                className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-medium text-white shadow-sm"
                style={{ backgroundColor: tag.color }}
              >
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => {
                    if (!isAdmin) return;
                    setEditingId(tag.id);
                    setDraftName(tag.name);
                    setDraftColor(tag.color);
                  }}
                  className={isAdmin ? 'transition hover:opacity-90' : 'cursor-default'}
                >
                  {tag.name}
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => void deleteTag(tag.id, entityType)}
                    className="rounded-full bg-black/10 p-1 text-white transition hover:bg-black/20"
                    aria-label={`Delete ${tag.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function TagsSettings(): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const projectTagsQuery = useProjectTags();
  const taskTagsQuery = useTaskTags();

  if (projectTagsQuery.isLoading || taskTagsQuery.isLoading) {
    return <TagsLoadingState />;
  }

  if (projectTagsQuery.isError || taskTagsQuery.isError) {
    return (
      <section className="panel flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div>
          <p className="font-semibold text-text-primary">Failed to load tags</p>
          <p className="mt-1 text-sm text-text-secondary">
            Try again to reload project and task tags.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void projectTagsQuery.refetch();
            void taskTagsQuery.refetch();
          }}
          className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <TagSection
        entityType={TagEntityType.project}
        title="Project tags"
        tags={projectTagsQuery.data ?? []}
        isAdmin={isAdmin}
      />
      <TagSection
        entityType={TagEntityType.task}
        title="Task tags"
        tags={taskTagsQuery.data ?? []}
        isAdmin={isAdmin}
      />
    </div>
  );
}
