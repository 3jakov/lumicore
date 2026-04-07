'use client';

import { AlertCircle, FolderOpen } from 'lucide-react';
import Link from 'next/link';

import { useProjects } from '@/hooks/use-projects';
import type { ProjectSummary } from '@/types/contracts';

import { ProjectStatusBadge } from './project-status-badge';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProjectCardSkeleton(): JSX.Element {
  return (
    <div className="panel flex flex-col gap-3 p-5 animate-pulse">
      <div className="h-5 w-20 rounded-full bg-border-subtle" />
      <div className="h-4 w-12 rounded bg-border-subtle" />
      <div className="h-5 w-3/4 rounded bg-border-subtle" />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectSummary }): JSX.Element {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="panel group flex flex-col gap-3 p-5 transition hover:border-border-strong hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <ProjectStatusBadge status={project.status} />
        {project.display_id && (
          <span className="font-mono text-xs text-text-muted">{project.display_id}</span>
        )}
      </div>
      <p className="font-semibold text-text-primary transition group-hover:text-accent-700">
        {project.name}
      </p>
    </Link>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

function LoadingState(): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="panel flex flex-col items-center gap-4 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <div>
        <p className="font-semibold text-text-primary">Failed to load projects</p>
        <p className="mt-1 text-sm text-text-secondary">Check your connection and try again.</p>
      </div>
      <button
        onClick={onRetry}
        className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-brand-50 hover:text-text-primary"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="panel flex flex-col items-center gap-4 py-16 text-center">
      <FolderOpen className="h-8 w-8 text-text-muted" />
      <div>
        <p className="font-semibold text-text-primary">No projects yet</p>
        <p className="mt-1 text-sm text-text-secondary">Projects will appear here once created.</p>
      </div>
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function ProjectsList(): JSX.Element {
  const { data, isLoading, isError, refetch } = useProjects();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const projects = data?.data ?? [];

  if (projects.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        {data?.meta.total ?? projects.length} project
        {(data?.meta.total ?? projects.length) !== 1 ? 's' : ''}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
