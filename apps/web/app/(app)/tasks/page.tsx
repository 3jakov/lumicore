import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { TasksList } from '@/components/tasks/tasks-list';

export default function TasksPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Tasks"
          title="Tasks"
          description="Track the baseline task queue now and layer richer scheduling, linked tools, and time context in the next iterations."
        />
        <Link
          href="/tasks/new"
          className="inline-flex items-center justify-center rounded-2xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700"
        >
          New task
        </Link>
      </div>

      <TasksList />
    </div>
  );
}
