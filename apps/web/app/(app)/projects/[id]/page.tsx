import { notFound } from 'next/navigation';

import { ProjectDetailShell } from '@/components/projects/project-detail-shell';

type ProjectDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound();
  }

  return <ProjectDetailShell id={projectId} />;
}
