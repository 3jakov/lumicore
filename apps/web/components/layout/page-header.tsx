type PageHeaderProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function PageHeader({ eyebrow, title, description }: PageHeaderProps): JSX.Element {
  return (
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-text-primary">{title}</h1>
      <p className="max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
    </header>
  );
}
