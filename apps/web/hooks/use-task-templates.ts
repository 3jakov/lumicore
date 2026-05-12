'use client';

import type { TaskTemplateSummary } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useTaskTemplates(): UseQueryResult<TaskTemplateSummary[]> {
  return useQuery({
    queryKey: queryKeys.tasks.templates,
    queryFn: () => apiClient.get<TaskTemplateSummary[]>('/tasks/templates'),
  });
}
