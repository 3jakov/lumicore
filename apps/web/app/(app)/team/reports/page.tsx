import { PageHeader } from '@/components/layout/page-header';
import { ReportsView } from '@/components/team/reports-view';

export default function ReportsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Команда"
        title="Отчёты"
        description="Сводная, детальная и незакреплённая статистика по времени."
      />
      <ReportsView />
    </div>
  );
}
