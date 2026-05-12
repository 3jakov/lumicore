'use client';

import type { EmployeeSummary, PaginatedResponse } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useEmployees(): UseQueryResult<PaginatedResponse<EmployeeSummary>> {
  return useQuery({
    queryKey: queryKeys.employees.list(),
    queryFn: () => apiClient.get<PaginatedResponse<EmployeeSummary>>('/employees'),
  });
}
