'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { useTask } from '@/hooks/use-task';

import { TaskPriorityBadge } from './task-priority-badge';
import { TaskStatusBadge } from './task-status-badge';

type TaskDetailShellProps = Readonly<{
  id: number;
}>;

function LoadingState(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="panel animate-pulse p-6">
        <div className="h-4 w-20 rounded bg-border-subtle" />
        <div className="mt-4 h-8 w-64 rounded bg-border-subtle" />
        <div className="mt-6 h-5 w-40 rounded bg-border-subtle" />
      </div>
      <div className="panel animate-pulse p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-3 w-24 rounded bg-border-subtle" />
              <div className="h-4 w-3/4 rounded bg-border-subtle" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState(): JSX.Element {
  return (
    <section className="panel flex flex-col items-start gap-4 p-6 text-left">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Tasks</p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Task not found</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          This task could not be found or you do not have access to it.
        </p>
      </div>
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to tasks
      </Link>
    </section>
  );
}

function DetailField({
  label,
  value,
}: Readonly<{ label: string; value: string | number | null }>): JSX.Element {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text-primary">{value ?? 'Not set'}</p>
    </div>
  );
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function TaskDetailShell({ id }: TaskDetailShellProps): JSX.Element {
  const { data, isLoading, isError } = useTask(id);

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Tasks
      </Link>

      <section className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <TaskStatusBadge status={data.status} />
              <TaskPriorityBadge priority={data.priority} />
            </div>
            <h1 className="text-3xl font-semibold text-text-primary">{data.name}</h1>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Link
              href={`/tasks/${id}/edit`}
              className="inline-flex items-center justify-center rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
            >
              Edit task
            </Link>
            <p className="text-sm leading-6 text-text-secondary md:max-w-sm md:text-right">
              Task comments, tools, and time links can layer onto this once those modules are fully
              integrated.
            </p>
          </div>
        </div>
      </section>

      <section className="panel space-y-6 p-6 md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">Task</p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">Task details</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailField label="Project ID" value={data.project_id} />
          <DetailField label="Template ID" value={data.template_id} />
          <DetailField label="Start time" value={formatDateTime(data.start_time)} />
          <DetailField label="End time" value={formatDateTime(data.end_time)} />
          <DetailField label="Location address" value={data.location_address} />
          <DetailField label="Latitude" value={data.location_lat} />
          <DetailField label="Longitude" value={data.location_lng} />
          <DetailField
            label="Assignees"
            value={data.assignee_ids.length > 0 ? data.assignee_ids.join(', ') : 'None'}
          />
          <DetailField label="Created" value={formatDateTime(data.created_at)} />
          <DetailField label="Updated" value={formatDateTime(data.updated_at)} />
        </div>
      </section>
    </div>
  );
}
