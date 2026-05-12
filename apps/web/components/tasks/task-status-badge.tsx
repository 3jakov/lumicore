'use client';

import { TaskStatus } from '@lumicore/shared-types';

const statusStyles: Record<TaskStatus, string> = {
  [TaskStatus.Uus]: 'bg-slate-100 text-slate-700',
  [TaskStatus.Teha]: 'bg-amber-100 text-amber-800',
  [TaskStatus.Toos]: 'bg-blue-100 text-blue-800',
  [TaskStatus.Tehtud]: 'bg-emerald-100 text-emerald-800',
};

export function TaskStatusBadge({ status }: Readonly<{ status: TaskStatus }>): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
