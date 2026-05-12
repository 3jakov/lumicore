import { PageHeader } from '@/components/layout/page-header';
import { TaskCreateForm } from '@/components/tasks/task-create-form';

export default function NewTaskPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tasks"
        title="New task"
        description="Create the baseline task record now and layer edits, archive flow, and richer operational context in the next step."
      />
      <TaskCreateForm />
    </div>
  );
}
