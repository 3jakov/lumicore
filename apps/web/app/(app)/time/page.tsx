'use client';

import { PageHeader } from '@/components/layout/page-header';
import { TimeDashboard } from '@/components/time/time-dashboard';
import { useTranslation } from '@/hooks/use-translation';

export default function TimePage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('time.eyebrow')}
        title={t('time.title')}
        description={t('time.description')}
      />
      <TimeDashboard />
    </div>
  );
}
