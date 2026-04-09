import { PageHeader } from '@/components/layout/page-header';
import { TimeDashboard } from '@/components/time/time-dashboard';

export default function TimePage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Time Tracking"
        title="My time"
        description="Track your own work with the real Phase 1 backend: start, pause, resume, stop, and review recent entries without waiting for realtime infrastructure."
      />
      <TimeDashboard />
    </div>
  );
}
