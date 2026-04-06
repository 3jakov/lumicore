import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';

type AuthenticatedLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps): JSX.Element {
  return <AppShell>{children}</AppShell>;
}
