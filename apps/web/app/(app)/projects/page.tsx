import { PageHeader } from '@/components/layout/page-header';
import { ProjectsList } from '@/components/projects/projects-list';

export default function ProjectsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title="Projects"
        description="All active and archived projects across field and production."
      />
      <ProjectsList />
    </div>
  );
}
