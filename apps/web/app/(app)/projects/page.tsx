import { PageHeader } from '@/components/layout/page-header';
import { ProjectsPageActions } from '@/components/projects/projects-page-actions';
import { ProjectsList } from '@/components/projects/projects-list';

export default function ProjectsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Projects"
          title="Projects"
          description="All active and archived projects across field and production."
        />
        <ProjectsPageActions />
      </div>
      <ProjectsList />
    </div>
  );
}
