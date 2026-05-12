'use client';

import { KeyRound, MessageSquareText } from 'lucide-react';
import { useState } from 'react';

import { useLoginWithPassword, useOtpLogin } from '@/hooks/use-auth-actions';

type Tab = 'password' | 'otp';

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/20 disabled:opacity-50 transition';

const primaryBtnCls =
  'w-full rounded-2xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60';

function InlineError({ message }: { message: string }): JSX.Element {
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </p>
  );
}

// ─── Password form ────────────────────────────────────────────────────────────

function PasswordForm(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading, error, login } = useLoginWithPassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void login({ email, password });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
        className={inputCls}
      />
      <input
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        required
        className={inputCls}
      />
      {error && <InlineError message={error} />}
      <button type="submit" disabled={isLoading || !email || !password} className={primaryBtnCls}>
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

// ─── OTP form ─────────────────────────────────────────────────────────────────

function OtpForm(): JSX.Element {
  const [phoneInput, setPhoneInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const { isLoading, error, step, phone, requestOtp, verifyOtp, backToPhone } = useOtpLogin();

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    void requestOtp({ phone: phoneInput });
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    void verifyOtp({ phone, code: codeInput });
  }

  if (step === 'code') {
    return (
      <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary">
          Code sent to <span className="font-semibold text-text-primary">{phone}</span>
        </p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter code"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          disabled={isLoading}
          required
          className={inputCls}
        />
        {error && <InlineError message={error} />}
        <button type="submit" disabled={isLoading || !codeInput} className={primaryBtnCls}>
          {isLoading ? 'Verifying…' : 'Verify'}
        </button>
        <button
          type="button"
          onClick={backToPhone}
          className="text-center text-sm text-text-muted transition hover:text-text-secondary"
        >
          Use a different number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-3">
      <input
        type="tel"
        autoComplete="tel"
        placeholder="+372 5xxx xxxx"
        value={phoneInput}
        onChange={(e) => setPhoneInput(e.target.value)}
        disabled={isLoading}
        required
        className={inputCls}
      />
      {error && <InlineError message={error} />}
      <button type="submit" disabled={isLoading || !phoneInput} className={primaryBtnCls}>
        {isLoading ? 'Sending…' : 'Send code'}
      </button>
    </form>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function LoginPanel(): JSX.Element {
  const [tab, setTab] = useState<Tab>('password');

  return (
    <section className="panel flex flex-col p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
        Authentication
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Sign in</h2>

      {/* Tab selector */}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('password')}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            tab === 'password'
              ? 'border-accent-600 bg-accent-600 text-white'
              : 'border-border-subtle bg-surface-1 text-text-secondary hover:bg-brand-50'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Email
        </button>
        <button
          type="button"
          onClick={() => setTab('otp')}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
            tab === 'otp'
              ? 'border-accent-600 bg-accent-600 text-white'
              : 'border-border-subtle bg-surface-1 text-text-secondary hover:bg-brand-50'
          }`}
        >
          <MessageSquareText className="h-4 w-4" />
          Phone
        </button>
      </div>

      <div className="mt-5 flex-1">{tab === 'password' ? <PasswordForm /> : <OtpForm />}</div>
    </section>
  );
}
