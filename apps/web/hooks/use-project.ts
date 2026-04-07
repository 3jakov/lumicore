'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { ProjectSummary } from '@/types/contracts';

export function useProject(id: number): UseQueryResult<ProjectSummary> {
  return useQuery({
    queryKey: ['projects', id],
    // GET /projects/:id - backend ProjectsModule not yet implemented.
    // Switch enabled: false -> true and wire params when backend is ready.
    queryFn: () => apiClient.get<ProjectSummary>(`/projects/${id}`),
    enabled: false,
  });
}
