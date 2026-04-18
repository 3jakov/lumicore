import { notFound } from 'next/navigation';

import { EmployeeDetailShell } from '@/components/employees/employee-detail-shell';

type PersonDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const employeeId = Number(id);

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    notFound();
  }

  return <EmployeeDetailShell id={employeeId} />;
}
