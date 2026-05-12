import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth } from '@/components/providers/require-auth';

type AuthenticatedLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps): JSX.Element {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
