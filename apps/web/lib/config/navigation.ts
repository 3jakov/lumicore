import type { Route } from 'next';

import type { DictionaryKey } from '@/lib/i18n';

export type NavItem = {
  href: Route;
  labelKey: DictionaryKey;
  icon: 'dashboard' | 'documents' | 'photos' | 'projects' | 'settings' | 'tasks' | 'team' | 'time' | 'tools';
  badgeKey?: DictionaryKey;
};

export type NavSection = {
  titleKey: DictionaryKey;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    titleKey: 'nav.sections.workspaces',
    items: [
      { href: '/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
      { href: '/projects', labelKey: 'nav.projects', icon: 'projects' },
      { href: '/tasks', labelKey: 'nav.tasks', icon: 'tasks' },
      { href: '/time', labelKey: 'nav.time', icon: 'time' },
      { href: '/time/timesheet', labelKey: 'nav.myTimesheet', icon: 'time' },
      { href: '/team/praegu', labelKey: 'nav.praegu', icon: 'team' },
      { href: '/tools', labelKey: 'nav.tools', icon: 'tools' },
      { href: '/photos', labelKey: 'nav.photos', icon: 'photos' },
      {
        href: '/documents',
        labelKey: 'nav.documents',
        icon: 'documents',
        badgeKey: 'nav.acknowledgementBadge',
      },
    ],
  },
  {
    titleKey: 'nav.sections.administration',
    items: [
      { href: '/team/people', labelKey: 'nav.people', icon: 'team' },
      { href: '/team/timesheet', labelKey: 'nav.timesheet', icon: 'time' },
      { href: '/team/reports', labelKey: 'nav.reports', icon: 'team' },
      { href: '/settings/profile', labelKey: 'nav.settings', icon: 'settings' },
    ],
  },
];
