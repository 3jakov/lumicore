'use client';

import type { PaginatedResponse, ProjectDetail, ProjectSummary } from '@lumicore/shared-types';
import { AlertCircle, ChevronLeft, FileText, FolderKanban, Image, Layers3, Users2 } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useProject } from '@/hooks/use-project';
import { useArchiveProject } from '@/hooks/use-archive-project';
import { queryKeys } from '@/lib/query/query-keys';

import { ProjectDocuments } from './project-documents';
import { ProjectPhotos } from './project-photos';
import { ProjectDetailSection } from './project-detail-section';
import { ProjectStatusBadge } from './project-status-badge';
import { useAuthStore } from '@/store/auth.store';

type ProjectDetailShellProps = Readonly<{
  id: number;
}>;

type ProjectDetailTab = 'Overview' | 'Tasks' | 'Team' | 'Documents' | 'Photos';

const detailTabs = [
  { label: 'Overview', icon: Layers3 },
  { label: 'Tasks', icon: FolderKanban },
  { label: 'Documents', icon: FileText },
  { label: 'Photos', icon: Image },
  { label: 'Team', icon: Users2 },
] satisfies { label: ProjectDetailTab; icon: typeof Layers3 }[];

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

function IntegrationPlaceholder({
  title,
  description,
}: Readonly<{ title: string; description: string }>): JSX.Element {
  return (
    <section className="panel p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
        Coming soon
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
    </section>
  );
}

export function ProjectDetailShell({ id }: ProjectDetailShellProps): JSX.Element {
  const queryClient = useQueryClient();
  const { data, error, isError, isFetching, isLoading } = useProject(id);
  const { isLoading: isArchiving, error: archiveError, archiveProject } = useArchiveProject(id);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = currentUser?.roles.includes('Administraator') ?? false;
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>('Overview');

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

  async function handleArchive(): Promise<void> {
    const confirmed = window.confirm(
      'Archive this project? It will be removed from the active projects list.',
    );

    if (!confirmed) return;

    await archiveProject();
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
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/projects/${id}/edit`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent-700 transition hover:text-accent-800"
                >
                  Edit project
                </Link>
                <button
                  type="button"
                  onClick={() => void handleArchive()}
                  disabled={isArchiving}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isArchiving ? 'Archiving...' : 'Archive project'}
                </button>
              </div>
            )}
          </div>
          <p className="text-sm leading-6 text-text-secondary md:max-w-sm md:text-right">
            Overview, tasks, documents, and team tabs will be activated as each module is
            integrated.
          </p>
        </div>
        {archiveError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {archiveError}
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {detailTabs.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(label)}
            className={`pill transition ${
              activeTab === label
                ? 'border-accent-200 bg-accent-50 text-accent-700'
                : 'hover:border-border-strong hover:text-text-primary'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {data && activeTab === 'Overview' ? <ProjectDetailSection project={data} /> : null}
      {data && activeTab === 'Documents' ? <ProjectDocuments projectId={data.id} /> : null}
      {data && activeTab === 'Photos' ? <ProjectPhotos projectId={data.id} /> : null}
      {data && activeTab === 'Tasks' ? (
        <IntegrationPlaceholder
          title="Project tasks"
          description="Task integration for this project detail view will be connected in a separate pass."
        />
      ) : null}
      {data && activeTab === 'Team' ? (
        <IntegrationPlaceholder
          title="Project team"
          description="Team assignments for this project detail view will be connected in a separate pass."
        />
      ) : null}
      {!data && (isLoading || isFetching) ? <DetailLoadingPanel /> : null}
      {!data && isError ? <DetailErrorPanel /> : null}
    </div>
  );
}
