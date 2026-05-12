import { PageHeader } from '@/components/layout/page-header';
import { EmployeeCreateForm } from '@/components/employees/employee-create-form';

export default function NewEmployeePage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="New employee"
        description="Create a new employee record using the current Phase 1 management fields."
      />
      <EmployeeCreateForm />
    </div>
  );
}
