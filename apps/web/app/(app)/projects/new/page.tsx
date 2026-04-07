import { PageHeader } from '@/components/layout/page-header';
import { ProjectCreateForm } from '@/components/projects/project-create-form';

export default function NewProjectPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title="New project"
        description="Create the initial project record now and layer assignments, tasks, and documents in later modules."
      />
      <ProjectCreateForm />
    </div>
  );
}
