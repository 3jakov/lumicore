'use client';

import type { TimesheetSummary } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { QueryParams } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export type TimesheetParams = {
  date_from: string;
  date_to: string;
};

export function useTimesheet(params: TimesheetParams): UseQueryResult<TimesheetSummary> {
  return useQuery({
    queryKey: queryKeys.timeEntries.timesheet(params),
    queryFn: () =>
      apiClient.get<TimesheetSummary>('/time-entries/timesheet', {
        params: params as QueryParams,
      }),
    enabled: Boolean(params.date_from && params.date_to),
  });
}
