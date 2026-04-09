import { PageHeader } from '@/components/layout/page-header';
import { TimesheetView } from '@/components/time/timesheet-view';

export default function PersonalTimesheetPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Time Tracking"
        title="My timesheet"
        description="Review your tracked time by day for the selected range. Phase 1 stays self-service and HTTP-driven."
      />
      <TimesheetView />
    </div>
  );
}
