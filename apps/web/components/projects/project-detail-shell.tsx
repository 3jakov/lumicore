'use client';

import type { PaginatedResponse, ProjectDetail, ProjectSummary } from '@lumicore/shared-types';
import { AlertCircle, ChevronLeft, FileText, FolderKanban, Layers3, Users2 } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

import { useProject } from '@/hooks/use-project';
import { queryKeys } from '@/lib/query/query-keys';

import { ProjectDetailSection } from './project-detail-section';
import { ProjectStatusBadge } from './project-status-badge';
import { useAuthStore } from '@/store/auth.store';

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

function DetailLoadingPanel(): JSX.Element {
  return (
    <section className="panel animate-pulse p-6 md:p-8">
      <div className="h-4 w-28 rounded bg-border-subtle" />
      <div className="mt-4 h-7 w-48 rounded bg-border-subtle" />
      <div className="mt-4 h-4 w-3/4 rounded bg-border-subtle" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
            <div className="h-3 w-24 rounded bg-border-subtle" />
            <div className="mt-3 h-4 w-3/4 rounded bg-border-subtle" />
          </div>
        ))}
      </div>
    </section>
  );
}

function NotFoundState(): JSX.Element {
  return (
    <section className="panel flex flex-col items-start gap-4 p-6 text-left">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Projects</p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Project not found</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          This project could not be found or you do not have access to it.
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

function DetailErrorPanel(): JSX.Element {
  return (
    <section className="panel flex flex-col gap-4 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Failed to load project details</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            The project header is available from cached list data, but the full detail response
            could not be loaded right now.
          </p>
        </div>
      </div>
      <p className="text-sm text-text-secondary">
        Try refreshing the page or return to the projects list and reopen the project.
      </p>
    </section>
  );
}

export function ProjectDetailShell({ id }: ProjectDetailShellProps): JSX.Element {
  const queryClient = useQueryClient();
  const { data, error, isError, isFetching, isLoading } = useProject(id);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;

  // Optimistic cache read: show list-level summary while the detail fetch is in-flight
  const listData = queryClient.getQueryData<PaginatedResponse<ProjectSummary>>(queryKeys.projects.list());
  const cachedProject = listData?.data.find((project) => project.id === id);
  // data (ProjectDetail) extends ProjectSummary — both satisfy the fields used in this shell
  const headerProject: ProjectSummary | ProjectDetail | null = data ?? cachedProject ?? null;

  if (!headerProject && (isLoading || isFetching)) {
    return <LoadingState />;
  }

  if (!headerProject && isError && error) {
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
            {headerProject?.status ? (
              <ProjectStatusBadge status={headerProject.status} />
            ) : (
              <span className="pill">Pending</span>
            )}
            <div className="space-y-1">
              {headerProject?.display_id && (
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-muted">
                  {headerProject.display_id}
                </p>
              )}
              <h1 className="text-3xl font-semibold text-text-primary">
                {headerProject?.name ?? `Project #${id}`}
              </h1>
            </div>
            {isAdmin && (
              <Link
                href={`/projects/${id}/edit`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
              >
                Edit project
              </Link>
            )}
          </div>
          <p className="text-sm leading-6 text-text-secondary md:max-w-sm md:text-right">
            Overview, tasks, documents, and team tabs will be activated as each module is
            integrated.
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

      {data ? <ProjectDetailSection project={data} /> : null}
      {!data && (isLoading || isFetching) ? <DetailLoadingPanel /> : null}
      {!data && isError ? <DetailErrorPanel /> : null}
    </div>
  );
}
