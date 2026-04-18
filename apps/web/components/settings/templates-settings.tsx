'use client';

import type { TaskTemplateSummary } from '@lumicore/shared-types';
import { TemplateType } from '@lumicore/shared-types';
import { AlertCircle, Layers3 } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTaskTemplates } from '@/hooks/use-task-templates';

function TemplateBadge({
  children,
  tone = 'default',
}: Readonly<{ children: ReactNode; tone?: 'default' | 'success' | 'muted' }>): JSX.Element {
  const cls =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'muted'
        ? 'border-slate-200 bg-slate-100 text-slate-700'
        : 'border-border-subtle bg-surface-1 text-text-secondary';

  return <span className={`pill ${cls}`}>{children}</span>;
}

function sortTemplates(templates: TaskTemplateSummary[], type: TemplateType): TaskTemplateSummary[] {
  return templates
    .filter((template) => template.type === type)
    .sort((left, right) => left.sort_order - right.sort_order);
}

function TemplateSection({
  title,
  templates,
}: Readonly<{ title: string; templates: TaskTemplateSummary[] }>): JSX.Element {
  return (
    <section className="panel p-5">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <div className="mt-4 space-y-3">
        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 px-4 py-8 text-center text-sm text-text-secondary">
            No templates in this category.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-border-subtle bg-surface-1 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{template.name}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {template.default_group
                      ? `Default group: ${template.default_group}`
                      : 'No default group'}
                  </p>
                </div>
                <TemplateBadge tone={template.is_active ? 'success' : 'muted'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </TemplateBadge>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function TemplatesLoadingState(): JSX.Element {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="panel animate-pulse p-5">
          <div className="h-5 w-32 rounded bg-border-subtle" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((__, itemIndex) => (
              <div key={itemIndex} className="h-20 rounded-2xl bg-border-subtle" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TemplatesSettings(): JSX.Element {
  const { data, isLoading, isError, refetch } = useTaskTemplates();

  if (isLoading) return <TemplatesLoadingState />;

  if (isError) {
    return (
      <section className="panel flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div>
          <p className="font-semibold text-text-primary">Failed to load task templates</p>
          <p className="mt-1 text-sm text-text-secondary">
            Try again to reload the current template catalogue.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary"
        >
          Retry
        </button>
      </section>
    );
  }

  const templates = data ?? [];
  const productionTemplates = sortTemplates(templates, TemplateType.production);
  const generalTemplates = sortTemplates(templates, TemplateType.general);

  return (
    <div className="space-y-4">
      <section className="panel flex items-start gap-3 p-5">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
          <Layers3 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-text-primary">
            Task templates are configured by the system administrator.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Templates are seeded by the system and available here as a read-only reference.
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <TemplateSection title="Production" templates={productionTemplates} />
        <TemplateSection title="General" templates={generalTemplates} />
      </div>
    </div>
  );
}
