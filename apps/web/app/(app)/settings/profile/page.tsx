import { PageHeader } from '@/components/layout/page-header';
import { ProfileForm } from '@/components/settings/profile-form';

export default function ProfileSettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Profile"
        description="Manage your name, language, and time display preferences."
      />
      <ProfileForm />
    </div>
  );
}
