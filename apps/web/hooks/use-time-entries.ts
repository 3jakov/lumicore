'use client';

import type { PaginatedResponse } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';
import type { TimeEntrySummary } from '@/types/contracts';

export function useTimeEntries(): UseQueryResult<PaginatedResponse<TimeEntrySummary>> {
  return useQuery({
    queryKey: queryKeys.timeEntries.list(),
    queryFn: () => apiClient.get<PaginatedResponse<TimeEntrySummary>>('/time-entries'),
    enabled: false,
  });
}
