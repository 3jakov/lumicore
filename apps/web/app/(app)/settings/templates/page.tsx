import { PageHeader } from '@/components/layout/page-header';
import { TemplatesSettings } from '@/components/settings/templates-settings';

export default function TemplateSettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Task templates"
        description="Browse seeded production and general templates available to the team."
      />
      <TemplatesSettings />
    </div>
  );
}
