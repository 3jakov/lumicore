'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ProjectDetail } from '@lumicore/shared-types';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useProject(id: number): UseQueryResult<ProjectDetail> {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => apiClient.get<ProjectDetail>(`/projects/${id}`),
    enabled: id > 0,
  });
}
