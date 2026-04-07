'use client';

import type { PaginatedResponse } from '@lumicore/shared-types';
import { ChevronLeft, FileText, FolderKanban, Layers3, Users2 } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

import { useProject } from '@/hooks/use-project';
import { queryKeys } from '@/lib/query/query-keys';
import type { ProjectSummary } from '@/types/contracts';

import { ProjectStatusBadge } from './project-status-badge';

type ProjectDetailShellProps = Readonly<{
  id: number;
}>;

const detailTabs = [
  { label: 'Overview', icon: Layers3 },
  { label: 'Tasks', icon: FolderKanban },
  { label: 'Documents', icon: FileText },
  { label: 'Team', icon: Users2 },
] as const;

function LoadingState(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="panel animate-pulse p-6">
        <div className="h-4 w-24 rounded bg-border-subtle" />
        <div className="mt-4 h-8 w-56 rounded bg-border-subtle" />
        <div className="mt-6 h-4 w-40 rounded bg-border-subtle" />
      </div>
      <div className="panel animate-pulse p-6">
        <div className="h-5 w-48 rounded bg-border-subtle" />
        <div className="mt-3 h-4 w-3/4 rounded bg-border-subtle" />
      </div>
    </div>
  );
}

function NotFoundState(): JSX.Element {
  return (
    <section className="panel flex flex-col items-start gap-4 p-6 text-left">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Projects</p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Project not found</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          This project is not available in the current list cache, and the dedicated detail endpoint
          is still waiting on backend implementation.
        </p>
      </div>
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to projects
      </Link>
    </section>
  );
}

export function ProjectDetailShell({ id }: ProjectDetailShellProps): JSX.Element {
  const queryClient = useQueryClient();
  const { data, error, isError, isFetching, isLoading } = useProject(id);

  const listData = queryClient.getQueryData<PaginatedResponse<ProjectSummary>>(queryKeys.projects.list());
  const cachedProject = listData?.data.find((project) => project.id === id);
  const project = data ?? cachedProject ?? null;

  if (isLoading || isFetching) {
    return <LoadingState />;
  }

  if (!project && isError && error) {
    return <NotFoundState />;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Projects
      </Link>

      <section className="panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            {project?.status ? <ProjectStatusBadge status={project.status} /> : <span className="pill">Pending</span>}
            <div className="space-y-1">
              {project?.display_id && (
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-muted">
                  {project.display_id}
                </p>
              )}
              <h1 className="text-3xl font-semibold text-text-primary">
                {project?.name ?? `Project #${id}`}
              </h1>
            </div>
          </div>
          <p className="text-sm leading-6 text-text-secondary md:max-w-sm md:text-right">
            Read-only project shell is live. Full detail data will attach here as soon as the
            backend ProjectsModule exposes a dedicated detail endpoint.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {detailTabs.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            disabled
            aria-disabled="true"
            className="pill cursor-not-allowed opacity-70"
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <section className="panel p-6 md:p-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
            Detail Handoff
          </p>
          <h2 className="text-2xl font-semibold text-text-primary">Project details loading soon</h2>
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">
            Overview, task rollup, linked documents, and team context will move into this panel once
            the backend project detail contract is implemented and shared-types are filled in.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-1 p-4">
            <p className="text-sm font-semibold text-text-primary">Overview</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Waiting for the full Project DTO beyond status, name, and display identifier.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-1 p-4">
            <p className="text-sm font-semibold text-text-primary">Documents</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Document linkage will appear here when project detail data and document endpoints are
              ready together.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-1 p-4">
            <p className="text-sm font-semibold text-text-primary">Team</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Assignees and live collaboration context stay intentionally deferred until the backend
              contract exists.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
