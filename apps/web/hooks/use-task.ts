'use client';

import type { TaskDetail } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useTask(id: number): UseQueryResult<TaskDetail> {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => apiClient.get<TaskDetail>(`/tasks/${id}`),
    enabled: id > 0,
  });
}
