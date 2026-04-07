import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { ProjectEditForm } from '@/components/projects/project-edit-form';

type ProjectEditPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ProjectEditPage({
  params,
}: ProjectEditPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title="Edit project"
        description="Adjust the current project record, then return to the detail view once the updates are saved."
      />
      <ProjectEditForm id={projectId} />
    </div>
  );
}
