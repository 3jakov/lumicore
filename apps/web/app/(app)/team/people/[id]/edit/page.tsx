import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/page-header';
import { EmployeeEditForm } from '@/components/employees/employee-edit-form';

type EmployeeEditPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function EmployeeEditPage({
  params,
}: EmployeeEditPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const employeeId = Number(id);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Edit employee"
        description="Update the current employee record and return to the detail view after saving."
      />
      <EmployeeEditForm id={employeeId} />
    </div>
  );
}
