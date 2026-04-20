'use client';

import { PageHeader } from '@/components/layout/page-header';
import { ProjectsPageActions } from '@/components/projects/projects-page-actions';
import { ProjectsList } from '@/components/projects/projects-list';
import { useTranslation } from '@/hooks/use-translation';

export default function ProjectsPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow={t('projects.title')}
          title={t('projects.title')}
          description={t('projects.description')}
        />
        <ProjectsPageActions />
      </div>
      <ProjectsList />
    </div>
  );
}
