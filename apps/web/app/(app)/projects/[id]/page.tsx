import { PlaceholderRoutePage } from '@/components/layout/placeholder-route-page';

type ProjectDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;

  return (
    <PlaceholderRoutePage
      eyebrow="Projects"
      title={`Project ${id}`}
      description="Reserved for task, calendar, documents, gallery, and budget placeholder tabs."
    />
  );
}
