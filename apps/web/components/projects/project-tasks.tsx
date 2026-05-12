'use client';

import type { TaskSummary } from '@lumicore/shared-types';
import { AlertCircle, ListTodo, UserRound } from 'lucide-react';

import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { useTasks } from '@/hooks/use-tasks';

type ProjectTasksProps = Readonly<{
  projectId: number;
}>;

function formatAssignees(assigneeIds: number[]): string {
  if (assigneeIds.length === 0) return 'No assignee';
  if (assigneeIds.length === 1) return `Assignee #${assigneeIds[0]}`;

  return `${assigneeIds.length} assignees`;
}

function TasksLoadingState(): JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <div className="animate-pulse space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-border-subtle" />
              <div className="h-6 w-20 rounded-full bg-border-subtle" />
            </div>
            <div className="h-5 w-2/3 rounded bg-border-subtle" />
            <div className="h-4 w-32 rounded bg-border-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TasksErrorState({ onRetry }: Readonly<{ onRetry: () => void }>): JSX.Element {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
        <div>
          <p className="font-semibold text-red-700">Failed to load project tasks</p>
          <p className="mt-1 text-sm text-red-600">
            Try again to reload tasks attached to this project.
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

function TaskRow({ task }: Readonly<{ task: TaskSummary }>): JSX.Element {
  return (
    <article className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
          <h3 className="truncate font-semibold text-text-primary">{task.name}</h3>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-sm text-text-secondary">
          <UserRound className="h-4 w-4 text-text-muted" />
          <span>{formatAssignees(task.assignee_ids)}</span>
        </div>
      </div>
    </article>
  );
}

export function ProjectTasks({ projectId }: ProjectTasksProps): JSX.Element {
  const { data, isLoading, isError, refetch } = useTasks({ project_id: projectId, limit: 100 });
  const tasks = data?.data ?? [];

  return (
    <section className="panel p-6 md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Project tasks
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Tasks</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Read-only list of tasks attached to this project.
        </p>
      </div>

      <div className="mt-6">
        {isLoading ? <TasksLoadingState /> : null}
        {isError ? <TasksErrorState onRetry={() => void refetch()} /> : null}
        {!isLoading && !isError && tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 px-4 py-12 text-center">
            <ListTodo className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-3 font-semibold text-text-primary">
              No tasks attached to this project yet.
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Project tasks will appear here after they are created.
            </p>
          </div>
        ) : null}
        {!isLoading && !isError && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
