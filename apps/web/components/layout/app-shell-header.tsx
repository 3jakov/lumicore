import { Bell, Globe2, Search, ShieldCheck } from 'lucide-react';

import { LanguageBadge } from '@/components/layout/language-badge';

export function AppShellHeader(): JSX.Element {
  return (
    <header className="panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Operational platform
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">Lumicore web shell</h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm text-text-secondary">
          <Search className="h-4 w-4" />
          Search scaffold
        </div>
        <div className="flex items-center gap-2">
          <LanguageBadge />
          <div className="pill gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Placeholder session
          </div>
          <div className="pill gap-2">
            <Bell className="h-3.5 w-3.5" />
            Alerts
          </div>
          <div className="pill gap-2">
            <Globe2 className="h-3.5 w-3.5" />
            ET / RU
          </div>
        </div>
      </div>
    </header>
  );
}
