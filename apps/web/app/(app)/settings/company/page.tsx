'use client';

import { Building2 } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { useTranslation } from '@/hooks/use-translation';

export default function CompanySettingsPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('settings.title')}
        title={t('settings.company.title')}
        description={t('settings.company.description')}
      />
      <section className="panel p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="rounded-[1.25rem] bg-brand-50 p-4 text-brand-700">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {t('settings.company.comingTitle')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{t('settings.company.includes')}</p>
          </div>
        </div>

        <ul className="mt-6 list-disc space-y-3 pl-5 text-sm text-text-secondary">
          <li>{t('settings.company.companyDetails')}</li>
          <li>{t('settings.company.calendar')}</li>
          <li>{t('settings.company.defaultHours')}</li>
        </ul>
      </section>
    </div>
  );
}
