'use client';

import { Bell, Globe2, LogOut, Search, User } from 'lucide-react';

import { LanguageBadge } from '@/components/layout/language-badge';
import { useLogout } from '@/hooks/use-auth-actions';
import { useAuthStore } from '@/store/auth.store';

export function AppShellHeader(): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { isLoading: isLoggingOut, logout } = useLogout();

  return (
    <header className="panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Operational platform
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">Lumicore</h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm text-text-secondary">
          <Search className="h-4 w-4" />
          Search
        </div>
        <div className="flex items-center gap-2">
          <LanguageBadge />
          <div className="pill gap-2">
            <Bell className="h-3.5 w-3.5" />
            Alerts
          </div>
          <div className="pill gap-2">
            <Globe2 className="h-3.5 w-3.5" />
            ET / RU
          </div>
          {currentUser && (
            <div className="flex items-center gap-1">
              <div className="pill gap-2">
                <User className="h-3.5 w-3.5" />
                {currentUser.initials}
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                disabled={isLoggingOut}
                className="pill gap-2 cursor-pointer transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                {isLoggingOut ? '…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
