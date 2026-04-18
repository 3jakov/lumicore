import { Building2 } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';

export default function CompanySettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Company settings"
        description="Organisation-wide company settings will land here in a future phase."
      />
      <section className="panel p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="rounded-[1.25rem] bg-brand-50 p-4 text-brand-700">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Coming in a future update</h2>
            <p className="mt-1 text-sm text-text-secondary">This section will include:</p>
          </div>
        </div>

        <ul className="mt-6 space-y-3 text-sm text-text-secondary">
          <li>• Company name and registration details</li>
          <li>• Working calendar and national holidays</li>
          <li>• Default working hours per group</li>
        </ul>
      </section>
    </div>
  );
}
