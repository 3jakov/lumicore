'use client';

import { PageHeader } from '@/components/layout/page-header';
import { TagsSettings } from '@/components/settings/tags-settings';
import { useTranslation } from '@/hooks/use-translation';

export default function TagSettingsPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('settings.title')}
        title={t('settings.tags.title')}
        description={t('settings.tags.description')}
      />
      <TagsSettings />
    </div>
  );
}
