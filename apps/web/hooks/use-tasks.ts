'use client';

import type { PaginatedResponse, TaskSummary } from '@lumicore/shared-types';
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { QueryParams } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useTasks(params?: QueryParams): UseQueryResult<PaginatedResponse<TaskSummary>> {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<TaskSummary>>('/tasks', { params }),
    placeholderData: keepPreviousData,
  });
}
