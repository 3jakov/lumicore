import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReportSummaryResponse } from '@lumicore/shared-types';
import { apiClient } from '@/lib/api-client';

export function useReportSummary(
  dateFrom: string,
  dateTo: string,
): UseQueryResult<ReportSummaryResponse> {
  return useQuery({
    queryKey: ['reports', 'summary', dateFrom, dateTo],
    queryFn: () =>
      apiClient.get<ReportSummaryResponse>('/time-entries/reports/summary', {
        params: { date_from: dateFrom, date_to: dateTo },
      }),
    enabled: Boolean(dateFrom && dateTo),
  });
}
