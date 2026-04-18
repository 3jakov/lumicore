'use client';

import type { RoleSummary } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useRoles(): UseQueryResult<RoleSummary[]> {
  return useQuery({
    queryKey: queryKeys.settings.roles,
    queryFn: () => apiClient.get<RoleSummary[]>('/settings/roles'),
  });
}
