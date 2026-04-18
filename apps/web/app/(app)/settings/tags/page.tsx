import { PageHeader } from '@/components/layout/page-header';
import { TagsSettings } from '@/components/settings/tags-settings';

export default function TagSettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Tags"
        description="Manage reusable project and task tags without leaving the settings area."
      />
      <TagsSettings />
    </div>
  );
}
