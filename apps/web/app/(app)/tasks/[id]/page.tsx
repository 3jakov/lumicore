import { PlaceholderRoutePage } from '@/components/layout/placeholder-route-page';

type TaskDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function TaskDetailPage({
  params,
}: TaskDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;

  return (
    <PlaceholderRoutePage
      eyebrow="Tasks"
      title={`Task ${id}`}
      description="Reserved for task details, assignees, linked tools, and activity context."
    />
  );
}
