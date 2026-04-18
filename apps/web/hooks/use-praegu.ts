'use client';

import type { ActiveTimerEntry } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function usePraegu(): UseQueryResult<ActiveTimerEntry[]> {
  return useQuery({
    queryKey: queryKeys.timeEntries.praegu,
    queryFn: () => apiClient.get<ActiveTimerEntry[]>('/time-entries/praegu'),
  });
}
