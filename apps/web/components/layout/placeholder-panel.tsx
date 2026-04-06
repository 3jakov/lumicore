type PlaceholderPanelProps = Readonly<{
  title: string;
  description: string;
}>;

export function PlaceholderPanel({ title, description }: PlaceholderPanelProps): JSX.Element {
  return (
    <section className="panel p-5">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
    </section>
  );
}
