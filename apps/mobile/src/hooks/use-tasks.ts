import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TaskSummary, PaginatedResponse } from '@lumicore/shared-types';

export function useTasks(projectId: number | null) {
  return useQuery<TaskSummary[]>({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<TaskSummary>>(
        `/tasks?project_id=${projectId}&limit=100`,
      );
      return res.data;
    },
    enabled: projectId != null,
    staleTime: 60_000,
  });
}
