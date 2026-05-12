'use client';

import { Priority } from '@lumicore/shared-types';

const priorityStyles: Record<Priority, string> = {
  [Priority.Madal]: 'bg-slate-100 text-slate-700',
  [Priority.Keskmine]: 'bg-indigo-100 text-indigo-800',
  [Priority.Korgeim]: 'bg-rose-100 text-rose-800',
};

export function TaskPriorityBadge({ priority }: Readonly<{ priority: Priority }>): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[priority]}`}
    >
      {priority}
    </span>
  );
}
