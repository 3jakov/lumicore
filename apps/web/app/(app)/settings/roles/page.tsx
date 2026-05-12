'use client';

import { PageHeader } from '@/components/layout/page-header';
import { RolesSettings } from '@/components/settings/roles-settings';
import { useTranslation } from '@/hooks/use-translation';

export default function RoleSettingsPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('settings.title')}
        title={t('settings.roles.title')}
        description={t('settings.roles.description')}
      />
      <RolesSettings />
    </div>
  );
}
