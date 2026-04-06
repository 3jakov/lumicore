import type { Route } from 'next';

export type NavItem = {
  href: Route;
  label: string;
  icon: 'dashboard' | 'documents' | 'projects' | 'settings' | 'tasks' | 'team' | 'time' | 'tools';
  badge?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: 'Workspaces',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { href: '/projects', label: 'Projects', icon: 'projects' },
      { href: '/tasks', label: 'Tasks', icon: 'tasks' },
      { href: '/time', label: 'Time tracking', icon: 'time' },
      { href: '/team/praegu', label: 'Praegu', icon: 'team' },
      { href: '/tools', label: 'Tools', icon: 'tools' },
      { href: '/documents', label: 'My documents', icon: 'documents', badge: 'Ack' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/team/people', label: 'People', icon: 'team' },
      { href: '/team/timesheet', label: 'Timesheet', icon: 'time' },
      { href: '/team/reports', label: 'Reports', icon: 'team' },
      { href: '/settings/profile', label: 'Settings', icon: 'settings' },
    ],
  },
];
