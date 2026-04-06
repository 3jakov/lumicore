'use client';

import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Language, TimeFormat } from '@lumicore/shared-types';

import { useUpdateProfile } from '@/hooks/use-update-profile';
import { useAuthStore } from '@/store/auth.store';

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}): JSX.Element {
  return (
    <div className="flex gap-1 rounded-2xl border border-border-subtle bg-surface-1 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
            value === opt.value
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-text-secondary hover:bg-brand-50 hover:text-text-primary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Profile form ─────────────────────────────────────────────────────────────

export function ProfileForm(): JSX.Element | null {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { isLoading, isSuccess, error, updateProfile } = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [language, setLanguage] = useState<Language>(Language.ET);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(TimeFormat.H24);

  // Initialise form from session on mount (currentUser is guaranteed non-null
  // inside (app) routes thanks to RequireAuth)
  // Intentionally empty deps — initialise from session once on mount.
  // currentUser is guaranteed non-null here (RequireAuth ensures it).
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
      setLanguage(currentUser.language);
      setTimeFormat(currentUser.time_format);
    }
  }, []); // intentional: seed form state once on mount, not on every re-render

  if (!currentUser) return null;

  const trimmedName = fullName.trim();
  const isDirty =
    trimmedName !== currentUser.full_name ||
    language !== currentUser.language ||
    timeFormat !== currentUser.time_format;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmedName) return;
    void updateProfile({
      full_name: trimmedName,
      language,
      time_format: timeFormat,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[auto_1fr]">
      {/* ── Identity card ───────────────────────────────────────────────────── */}
      <div className="panel flex flex-col items-center gap-4 p-6 xl:w-56">
        {/* Avatar */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-[2rem] text-xl font-semibold text-white"
          style={{ backgroundColor: currentUser.avatar_color }}
        >
          {currentUser.initials}
        </div>
        <div className="w-full space-y-1 text-center">
          <p className="font-semibold text-text-primary">{currentUser.full_name}</p>
          <p className="text-sm text-text-muted">{currentUser.group}</p>
        </div>
        {currentUser.roles.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {currentUser.roles.map((role) => (
              <span key={role} className="pill text-xs">
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit form ────────────────────────────────────────────────────────── */}
      <section className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Settings
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your personal preferences. Changes apply immediately after saving.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 max-w-sm space-y-5">
          {/* Full name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary" htmlFor="full-name">
              Full name
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              placeholder="Your name"
              className={inputCls}
            />
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-text-primary">Language</p>
            <ToggleGroup
              value={language}
              onChange={setLanguage}
              disabled={isLoading}
              options={[
                { value: Language.ET, label: 'Eesti' },
                { value: Language.RU, label: 'Русский' },
              ]}
            />
          </div>

          {/* Time format */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-text-primary">Time format</p>
            <ToggleGroup
              value={timeFormat}
              onChange={setTimeFormat}
              disabled={isLoading}
              options={[
                { value: TimeFormat.H24, label: '24h' },
                { value: TimeFormat.H12, label: '12h' },
              ]}
            />
          </div>

          {/* Feedback */}
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
          {isSuccess && (
            <p className="flex items-center gap-2 rounded-xl bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Saved
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !trimmedName || !isDirty}
            className="w-full rounded-2xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>
    </div>
  );
}
