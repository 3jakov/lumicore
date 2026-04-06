import { ArrowRight, KeyRound, MessageSquareText } from 'lucide-react';

export function PlaceholderAuthPanel(): JSX.Element {
  return (
    <section className="panel p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
            Authentication
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Login placeholder</h2>
        </div>
        <div className="pill">M1</div>
      </div>
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <div className="flex items-center gap-3">
            <MessageSquareText className="h-5 w-5 text-accent-600" />
            <div>
              <p className="font-semibold">OTP login flow</p>
              <p className="text-sm text-text-secondary">
                Reserved for phone-first auth once backend endpoints are available.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-accent-600" />
            <div>
              <p className="font-semibold">Email + password fallback</p>
              <p className="text-sm text-text-secondary">
                Structure is intentionally ready, but no auth behavior is implemented yet.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 text-sm text-text-secondary">
        <span>All mutations will go through NestJS `/api/v1/*` endpoints.</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </section>
  );
}
