'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppShellHeader } from '@/components/layout/app-shell-header';
import { AppShellSidebar } from '@/components/layout/app-shell-sidebar';
import { SearchModal } from '@/components/layout/search-modal';
import { TimerDock } from '@/components/layout/timer-dock';

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen px-3 py-3 md:px-4 md:py-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-3">
        {/* Desktop sidebar */}
        <AppShellSidebar />

        {/* Mobile drawer overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 shadow-2xl">
              <AppShellSidebar mobile onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <AppShellHeader
            onMenuToggle={() => setMobileMenuOpen((v) => !v)}
            onSearchOpen={() => setSearchOpen(true)}
          />
          <main className="flex-1 rounded-[2rem] border border-border-subtle bg-surface-1/80 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>

      <TimerDock />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
