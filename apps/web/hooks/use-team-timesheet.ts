import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { TeamTimesheetResponse } from '@lumicore/shared-types';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useTeamTimesheet(
  dateFrom: string,
  dateTo: string,
): UseQueryResult<TeamTimesheetResponse> {
  return useQuery({
    queryKey: queryKeys.timeEntries.teamTimesheet(dateFrom, dateTo),
    queryFn: () =>
      apiClient.get<TeamTimesheetResponse>('/time-entries/timesheet/team', {
        params: { date_from: dateFrom, date_to: dateTo },
      }),
    enabled: Boolean(dateFrom && dateTo),
  });
}
