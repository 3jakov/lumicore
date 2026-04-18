import { PageHeader } from '@/components/layout/page-header';
import { RolesSettings } from '@/components/settings/roles-settings';

export default function RoleSettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Roles"
        description="Review the current access roles and maintain the role catalogue for the organisation."
      />
      <RolesSettings />
    </div>
  );
}
