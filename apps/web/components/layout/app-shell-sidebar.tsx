'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Clock3,
  FileCheck2,
  FolderKanban,
  Home,
  Settings2,
  Users2,
  Wrench,
  X,
} from 'lucide-react';

import { useTranslation } from '@/hooks/use-translation';
import { navSections } from '@/lib/config/navigation';

type Props = {
  mobile?: boolean;
  onClose?: () => void;
};

export function AppShellSidebar({ mobile = false, onClose }: Props): JSX.Element {
  const { t } = useTranslation();
  const pathname = usePathname();

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

  const content = (
    <>
      <div className="border-b border-border-subtle pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
              {t('app.name')}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{t('shell.sidebarTitle')}</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {t('shell.sidebarDescription')}
            </p>
          </div>
          {mobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 flex-shrink-0 rounded-full p-2 text-text-muted hover:bg-surface-2 hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
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
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition ${
                        isActive
                          ? 'bg-brand-100 font-semibold text-text-primary'
                          : 'text-text-secondary hover:bg-brand-50 hover:text-text-primary'
                      }`}
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
    </>
  );

  if (mobile) {
    return (
      <aside className="panel flex h-full w-full flex-col overflow-hidden px-4 py-5">
        {content}
      </aside>
    );
  }

  return (
    <aside className="panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-[var(--shell-sidebar-width)] shrink-0 flex-col overflow-hidden px-4 py-5 lg:flex">
      {content}
    </aside>
  );
}
