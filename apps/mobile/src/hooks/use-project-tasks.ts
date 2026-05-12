import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TaskSummary, PaginatedResponse } from '@lumicore/shared-types';

/**
 * Fetch tasks for the tasks list screen.
 * When projectId is provided, filters by project.
 * When null, fetches all tasks (always enabled).
 * Separate from use-tasks.ts which disables when projectId is null (used in pickers).
 */
export function useProjectTasks(projectId: number | null) {
  return useQuery<TaskSummary[]>({
    queryKey: ['tasks', 'screen', projectId],
    queryFn: async () => {
      const url = projectId
        ? `/tasks?project_id=${projectId}&limit=100`
        : `/tasks?limit=100`;
      const res = await apiClient.get<PaginatedResponse<TaskSummary>>(url);
      return res.data;
    },
    staleTime: 30_000,
  });
}
