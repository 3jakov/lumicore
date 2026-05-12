import { PageHeader } from '@/components/layout/page-header';
import { TeamTimesheetGrid } from '@/components/team/team-timesheet-grid';

export default function TeamTimesheetPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Команда"
        title="Часовой табель"
        description="Отработанные часы по сотрудникам за выбранный месяц."
      />
      <TeamTimesheetGrid />
    </div>
  );
}
