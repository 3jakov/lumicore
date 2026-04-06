import type { ReactNode } from 'react';

import { AppShellHeader } from '@/components/layout/app-shell-header';
import { AppShellSidebar } from '@/components/layout/app-shell-sidebar';
import { TimerDock } from '@/components/layout/timer-dock';

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps): JSX.Element {
  return (
    <div className="min-h-screen px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-3">
        <AppShellSidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <AppShellHeader />
          <main className="flex-1 rounded-[2rem] border border-border-subtle bg-surface-1/80 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <TimerDock />
    </div>
  );
}
