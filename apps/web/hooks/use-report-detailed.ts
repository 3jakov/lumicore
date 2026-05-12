import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReportDetailResponse } from '@lumicore/shared-types';
import { apiClient } from '@/lib/api-client';

type Params = {
  dateFrom: string;
  dateTo: string;
  employeeId?: number;
  projectId?: number;
  unassignedOnly?: boolean;
  page?: number;
  limit?: number;
};

export function useReportDetailed(params: Params): UseQueryResult<ReportDetailResponse> {
  const { dateFrom, dateTo, employeeId, projectId, unassignedOnly, page = 1, limit = 50 } = params;
  return useQuery({
    queryKey: ['reports', 'detailed', dateFrom, dateTo, employeeId, projectId, unassignedOnly, page],
    queryFn: () =>
      apiClient.get<ReportDetailResponse>('/time-entries/reports/detailed', {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          employee_id: employeeId,
          project_id: projectId,
          unassigned_only: unassignedOnly,
          page,
          limit,
        },
      }),
    enabled: Boolean(dateFrom && dateTo),
  });
}
