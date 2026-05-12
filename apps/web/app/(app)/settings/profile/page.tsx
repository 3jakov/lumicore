'use client';

import { PageHeader } from '@/components/layout/page-header';
import { ProfileForm } from '@/components/settings/profile-form';
import { useTranslation } from '@/hooks/use-translation';

export default function ProfileSettingsPage(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('settings.title')}
        title={t('settings.profile.title')}
        description={t('settings.profile.description')}
      />
      <ProfileForm />
    </div>
  );
}
