'use client';

import { useEffect } from 'react';
import { Bell, Globe2, LogOut, Menu, Search, User } from 'lucide-react';
import Link from 'next/link';

import { Language } from '@lumicore/shared-types';

import { useLogout } from '@/hooks/use-auth-actions';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth.store';

type Props = {
  onMenuToggle: () => void;
  onSearchOpen: () => void;
};

export function AppShellHeader({ onMenuToggle, onSearchOpen }: Props): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { isLoading: isLoggingOut, logout } = useLogout();
  const { updateProfile } = useUpdateProfile();
  const { language } = useTranslation();

  const nextLanguage = language === 'et' ? Language.RU : Language.ET;

  async function handleLanguageToggle(): Promise<void> {
    await updateProfile({ language: nextLanguage });
  }

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpen();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSearchOpen]);

  return (
    <header className="panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border-subtle bg-surface-1 text-text-muted transition hover:border-border-strong hover:text-text-primary lg:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
            Operational platform
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary">Lumicore</h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search button */}
        <button
          type="button"
          onClick={onSearchOpen}
          className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm text-text-muted transition hover:border-border-strong hover:text-text-primary"
        >
          <Search className="h-4 w-4 flex-shrink-0" />
          <span>Search</span>
          <kbd className="ml-2 hidden rounded-md border border-border-subtle px-1.5 py-0.5 text-xs sm:inline">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          {/* Current language indicator */}
          <div className="pill text-xs font-semibold uppercase tracking-wide">
            {language}
          </div>

          {/* Alerts — Phase 2 placeholder */}
          <div className="pill gap-2 text-text-muted select-none">
            <Bell className="h-3.5 w-3.5" />
            Alerts
          </div>

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => void handleLanguageToggle()}
            title={`Switch to ${nextLanguage.toUpperCase()}`}
            className="pill gap-2 cursor-pointer transition hover:border-accent-200 hover:bg-accent-50 hover:text-accent-700"
          >
            <Globe2 className="h-3.5 w-3.5" />
            ET / RU
          </button>

          {currentUser && (
            <div className="flex items-center gap-1">
              <Link
                href="/settings/profile"
                className="pill gap-2 transition hover:border-border-strong hover:text-text-primary"
                title="Profile settings"
              >
                <User className="h-3.5 w-3.5" />
                {currentUser.initials}
              </Link>

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
