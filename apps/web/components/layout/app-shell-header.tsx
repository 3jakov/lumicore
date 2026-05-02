'use client';

import { Bell, Globe2, LogOut, Search, User } from 'lucide-react';
import Link from 'next/link';

import { Language } from '@lumicore/shared-types';

import { useLogout } from '@/hooks/use-auth-actions';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { useTranslation } from '@/hooks/use-translation';
import { useAuthStore } from '@/store/auth.store';

export function AppShellHeader(): JSX.Element {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { isLoading: isLoggingOut, logout } = useLogout();
  const { updateProfile } = useUpdateProfile();
  const { language } = useTranslation();

  const nextLanguage = language === 'et' ? Language.RU : Language.ET;

  async function handleLanguageToggle(): Promise<void> {
    await updateProfile({ language: nextLanguage });
  }

  return (
    <header className="panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Operational platform
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">Lumicore</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search — Phase 2 placeholder */}
        <div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-sm text-text-muted select-none">
          <Search className="h-4 w-4" />
          Search
        </div>

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
              {/* Profile link */}
              <Link
                href="/settings/profile"
                className="pill gap-2 transition hover:border-border-strong hover:text-text-primary"
                title="Profile settings"
              >
                <User className="h-3.5 w-3.5" />
                {currentUser.initials}
              </Link>

              {/* Sign out */}
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
