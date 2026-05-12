import { ProjectStatus } from '@lumicore/shared-types';

const statusStyles: Record<ProjectStatus, string> = {
  [ProjectStatus.Hinnapakkumises]: 'bg-amber-100 text-amber-800',
  [ProjectStatus.Ettevalmistuses]: 'bg-blue-100 text-blue-800',
  [ProjectStatus.Toos]: 'bg-green-100 text-green-800',
  [ProjectStatus.Lopetatud]: 'bg-gray-100 text-gray-700',
};

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
};

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
