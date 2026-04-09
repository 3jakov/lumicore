'use client';

import type { PaginatedResponse, TimeEntrySummary } from '@lumicore/shared-types';
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { QueryParams } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useTimeEntries(
  params?: QueryParams,
): UseQueryResult<PaginatedResponse<TimeEntrySummary>> {
  return useQuery({
    queryKey: queryKeys.timeEntries.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<TimeEntrySummary>>('/time-entries', { params }),
    placeholderData: keepPreviousData,
  });
}
