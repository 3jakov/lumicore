import { notFound } from 'next/navigation';

import { TaskEditForm } from '@/components/tasks/task-edit-form';

type TaskEditPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function TaskEditPage({ params }: TaskEditPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const taskId = Number(id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    notFound();
  }

  return <TaskEditForm id={taskId} />;
}
