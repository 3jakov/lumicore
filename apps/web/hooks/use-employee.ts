'use client';

import type { EmployeeDetail } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useEmployee(id: number): UseQueryResult<EmployeeDetail> {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => apiClient.get<EmployeeDetail>(`/employees/${id}`),
    enabled: id > 0,
  });
}
