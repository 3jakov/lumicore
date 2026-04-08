import { notFound } from 'next/navigation';

import { TaskDetailShell } from '@/components/tasks/task-detail-shell';

type TaskDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function TaskDetailPage({
  params,
}: TaskDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const taskId = Number(id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound();
  }

  return <TaskDetailShell id={taskId} />;
}
