'use client';

import type { TaskSummary } from '@lumicore/shared-types';
import { AlertCircle, ListTodo } from 'lucide-react';
import Link from 'next/link';

import { useTasks } from '@/hooks/use-tasks';

import { TaskPriorityBadge } from './task-priority-badge';
import { TaskStatusBadge } from './task-status-badge';

function TaskCardSkeleton(): JSX.Element {
  return (
    <div className="panel flex flex-col gap-3 p-5 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-20 rounded-full bg-border-subtle" />
        <div className="h-5 w-20 rounded-full bg-border-subtle" />
      </div>
      <div className="h-5 w-2/3 rounded bg-border-subtle" />
      <div className="h-4 w-1/2 rounded bg-border-subtle" />
    </div>
  );
}

function TaskCard({ task }: Readonly<{ task: TaskSummary }>): JSX.Element {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="panel group flex flex-col gap-3 p-5 transition hover:border-border-strong hover:shadow-md"
    >
      <div className="flex flex-wrap gap-2">
        <TaskStatusBadge status={task.status} />
        <TaskPriorityBadge priority={task.priority} />
      </div>
      <p className="font-semibold text-text-primary transition group-hover:text-accent-700">
        {task.name}
      </p>
      <div className="space-y-1 text-sm text-text-secondary">
        <p>{task.project_id ? `Project #${task.project_id}` : 'No project linked'}</p>
        <p>
          {task.assignee_ids.length > 0
            ? `${task.assignee_ids.length} assignee${task.assignee_ids.length !== 1 ? 's' : ''}`
            : 'No assignees'}
        </p>
      </div>
    </Link>
  );
}

function LoadingState(): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: Readonly<{ onRetry: () => void }>): JSX.Element {
  return (
    <div className="panel flex flex-col items-center gap-4 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <div>
        <p className="font-semibold text-text-primary">Failed to load tasks</p>
        <p className="mt-1 text-sm text-text-secondary">Check your connection and try again.</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-brand-50 hover:text-text-primary"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="panel flex flex-col items-center gap-4 py-16 text-center">
      <ListTodo className="h-8 w-8 text-text-muted" />
      <div>
        <p className="font-semibold text-text-primary">No tasks yet</p>
        <p className="mt-1 text-sm text-text-secondary">Tasks will appear here once created.</p>
      </div>
      <Link
        href="/tasks/new"
        className="rounded-2xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
      >
        Create first task
      </Link>
    </div>
  );
}

export function TasksList(): JSX.Element {
  const { data, isLoading, isError, refetch } = useTasks();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const tasks = data?.data ?? [];

  if (tasks.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        {data?.meta.total ?? tasks.length} task
        {(data?.meta.total ?? tasks.length) !== 1 ? 's' : ''}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
