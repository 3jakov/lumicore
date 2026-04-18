import { PageHeader } from '@/components/layout/page-header';
import { EmployeesList } from '@/components/employees/employees-list';
import { PeoplePageActions } from '@/components/employees/people-page-actions';

export default function PeoplePage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Team"
          title="People"
          description="Browse the current employee roster and open individual staff records."
        />
        <PeoplePageActions />
      </div>
      <EmployeesList />
    </div>
  );
}
