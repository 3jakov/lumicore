import { PlaceholderRoutePage } from '@/components/layout/placeholder-route-page';

type PersonDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;

  return (
    <PlaceholderRoutePage
      eyebrow="Team"
      title={`Employee ${id}`}
      description="Reserved for employee profile, permissions, and later edit controls."
    />
  );
}
