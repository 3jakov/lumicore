import { PageHeader } from '@/components/layout/page-header';
import { PlaceholderPanel } from '@/components/layout/placeholder-panel';

export default function DashboardPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="M0 Foundation"
        title="Dashboard shell"
        description="Initial authenticated landing area for future operational modules."
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <PlaceholderPanel
          title="Realtime surface"
          description="Prepared for Praegu live timers, active work summary, and notifications."
        />
        <PlaceholderPanel
          title="Daily workstream"
          description="Prepared for project, task, and time tracking widgets without shipping feature logic yet."
        />
        <PlaceholderPanel
          title="Mobile readiness"
          description="Reserved for PWA prompts, offline state, and camera/GPS capabilities later in M7."
        />
      </div>
    </div>
  );
}
