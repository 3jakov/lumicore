'use client';

import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { TasksList } from '@/components/tasks/tasks-list';
import { useTranslation } from '@/hooks/use-translation';

export default function TasksPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow={t('tasks.title')}
          title={t('tasks.title')}
          description={t('tasks.description')}
        />
        <Link
          href="/tasks/new"
          className="inline-flex items-center justify-center rounded-2xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700"
        >
          {t('tasks.create')}
        </Link>
      </div>

      <TasksList />
    </div>
  );
}
