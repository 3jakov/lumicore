'use client';

import { PageHeader } from '@/components/layout/page-header';
import { EmployeesList } from '@/components/employees/employees-list';
import { PeoplePageActions } from '@/components/employees/people-page-actions';
import { useTranslation } from '@/hooks/use-translation';

export default function PeoplePage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow={t('team.title')}
          title={t('team.people.title')}
          description={t('team.people.description')}
        />
        <PeoplePageActions />
      </div>
      <EmployeesList />
    </div>
  );
}
