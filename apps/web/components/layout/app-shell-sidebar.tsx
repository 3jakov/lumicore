'use client';

import Link from 'next/link';
import {
  Box,
  Clock3,
  FileCheck2,
  FolderKanban,
  Home,
  Settings2,
  Users2,
  Wrench,
} from 'lucide-react';

import { useTranslation } from '@/hooks/use-translation';
import { navSections } from '@/lib/config/navigation';

export function AppShellSidebar(): JSX.Element {
  const { t } = useTranslation();
  const iconMap = {
    dashboard: Home,
    projects: FolderKanban,
    tasks: Box,
    time: Clock3,
    team: Users2,
    tools: Wrench,
    documents: FileCheck2,
    settings: Settings2,
  } as const;

  return (
    <aside className="panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-[var(--shell-sidebar-width)] shrink-0 flex-col overflow-hidden px-4 py-5 lg:flex">
      <div className="border-b border-border-subtle pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          {t('app.name')}
        </p>
        <h2 className="mt-2 text-xl font-semibold">{t('shell.sidebarTitle')}</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {t('shell.sidebarDescription')}
        </p>
      </div>
      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.titleKey}>
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              {t(section.titleKey)}
            </p>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon];

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm text-text-secondary transition hover:bg-brand-50 hover:text-text-primary"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {t(item.labelKey)}
                      </span>
                      {item.badgeKey ? <span className="pill">{t(item.badgeKey)}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
