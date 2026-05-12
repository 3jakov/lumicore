'use client';

import type { ProjectDetail } from '@lumicore/shared-types';

type ProjectDetailSectionProps = Readonly<{
  project: ProjectDetail;
}>;

function formatDate(value: string | null): string {
  if (!value) return 'Not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function DetailField({
  label,
  value,
}: Readonly<{
  label: string;
  value: string | number | null;
}>): JSX.Element {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text-primary">{value ?? 'Not set'}</p>
    </div>
  );
}

export function ProjectDetailSection({ project }: ProjectDetailSectionProps): JSX.Element {
  return (
    <section className="panel p-6 md:p-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Project Details
        </p>
        <h2 className="text-2xl font-semibold text-text-primary">Overview</h2>
        <p className="max-w-2xl text-sm leading-6 text-text-secondary">
          Current backend detail payload is connected here as a read-only page. Edit flows can plug
          into the same structure later without reworking the layout.
        </p>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
            Description
          </p>
          <p className="mt-3 text-sm leading-7 text-text-primary">
            {project.description ?? 'No project description has been added yet.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Created" value={formatDateTime(project.created_at)} />
          <DetailField label="Updated" value={formatDateTime(project.updated_at)} />
          <DetailField label="Start date" value={formatDate(project.start_date)} />
          <DetailField label="End date" value={formatDate(project.end_date)} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DetailField label="Contract number" value={project.contract_number} />
        <DetailField label="Project manager ID" value={project.project_manager_id} />
        <DetailField label="Location address" value={project.location_address} />
        <DetailField label="Location latitude" value={project.location_lat} />
        <DetailField label="Location longitude" value={project.location_lng} />
        <DetailField label="Client company" value={project.client_company_name} />
        <DetailField label="Client reg. code" value={project.client_reg_code} />
        <DetailField label="Client contact" value={project.client_contact_name} />
        <DetailField label="Client phone" value={project.client_phone} />
        <DetailField label="Client email" value={project.client_email} />
      </div>
    </section>
  );
}
