import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderPanel } from '@/components/layout/placeholder-panel';

type PlaceholderRoutePageProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function PlaceholderRoutePage({
  eyebrow,
  title,
  description,
}: PlaceholderRoutePageProps): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="grid gap-4 xl:grid-cols-2">
        <PlaceholderPanel
          title="Integration boundary"
          description="This route is ready to consume typed API hooks, query caching, and shared state once contracts settle."
        />
        <PlaceholderPanel
          title="Feature implementation later"
          description="UI flows and business behavior stay deferred so M0 remains a stable foundation rather than speculative product work."
        />
      </div>
    </div>
  );
}
