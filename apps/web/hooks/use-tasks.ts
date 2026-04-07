'use client';

import type { PaginatedResponse } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';
import type { TaskSummary } from '@/types/contracts';

export function useTasks(): UseQueryResult<PaginatedResponse<TaskSummary>> {
  return useQuery({
    queryKey: queryKeys.tasks.list(),
    queryFn: () => apiClient.get<PaginatedResponse<TaskSummary>>('/tasks'),
  });
}
