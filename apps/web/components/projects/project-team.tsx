'use client';

import type { ProjectDetail } from '@lumicore/shared-types';
import { UsersRound } from 'lucide-react';

type ProjectTeamProps = Readonly<{
  project: ProjectDetail;
}>;

type ProjectTeamMember = {
  id: number;
  name: string;
  group?: string | null;
  role?: string | null;
};

type ProjectWithOptionalTeam = ProjectDetail & {
  assigned_employees?: ProjectTeamMember[];
  team_members?: ProjectTeamMember[];
  members?: ProjectTeamMember[];
};

function getTeamMembers(project: ProjectDetail): ProjectTeamMember[] | null {
  const projectWithTeam = project as ProjectWithOptionalTeam;

  return (
    projectWithTeam.assigned_employees ??
    projectWithTeam.team_members ??
    projectWithTeam.members ??
    null
  );
}

function TeamMemberRow({ member }: Readonly<{ member: ProjectTeamMember }>): JSX.Element {
  return (
    <article className="rounded-2xl border border-border-subtle bg-surface-1 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-text-primary">{member.name}</h3>
          <p className="mt-1 text-sm text-text-secondary">{member.group ?? 'No group'}</p>
        </div>
        {member.role ? (
          <span className="inline-flex shrink-0 items-center rounded-full border border-border-subtle bg-white px-3 py-1 text-xs font-semibold text-text-secondary">
            {member.role}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function ProjectTeam({ project }: ProjectTeamProps): JSX.Element {
  const members = getTeamMembers(project);

  return (
    <section className="panel p-6 md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-text-muted">
          Project team
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">Team</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Read-only project team assignment overview.
        </p>
      </div>

      <div className="mt-6">
        {!members || members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 px-4 py-12 text-center">
            <UsersRound className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-3 font-semibold text-text-primary">Team data not yet available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <TeamMemberRow key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
