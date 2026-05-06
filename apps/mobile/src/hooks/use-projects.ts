import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ProjectSummary, PaginatedResponse } from '@lumicore/shared-types';

export function useProjects() {
  return useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<ProjectSummary>>(
        '/projects?limit=100',
      );
      return res.data;
    },
    staleTime: 60_000,
  });
}
