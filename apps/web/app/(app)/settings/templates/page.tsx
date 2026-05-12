'use client';

import { PageHeader } from '@/components/layout/page-header';
import { TemplatesSettings } from '@/components/settings/templates-settings';
import { useTranslation } from '@/hooks/use-translation';

export default function TemplateSettingsPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('settings.title')}
        title={t('settings.templates.title')}
        description={t('settings.templates.description')}
      />
      <TemplatesSettings />
    </div>
  );
}
