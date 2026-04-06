'use client';

import type { PaginatedResponse } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';
import type { ProjectSummary } from '@/types/contracts';

export function useProjects(): UseQueryResult<PaginatedResponse<ProjectSummary>> {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => apiClient.get<PaginatedResponse<ProjectSummary>>('/projects'),
    enabled: false,
  });
}
