export function AuthIntroCard(): JSX.Element {
  return (
    <section className="panel hidden flex-col justify-between bg-[linear-gradient(160deg,rgba(125,145,74,0.92),rgba(49,58,31,0.96))] p-8 text-text-inverse lg:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
          Lumicore foundation
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">
          Frontend shell for field, factory, and office workflows.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-brand-100">
          This M0 scaffold sets up the app router, providers, shared integration points, and
          bilingual groundwork without shipping product logic too early.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">
            Ready for
          </p>
          <p className="mt-2 text-lg font-semibold">API integration</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">
            Prepared for
          </p>
          <p className="mt-2 text-lg font-semibold">PWA + i18n</p>
        </div>
      </div>
    </section>
  );
}
