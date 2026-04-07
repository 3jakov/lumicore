'use client';

import type { PaginatedResponse } from '@lumicore/shared-types';
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { QueryParams } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';
import type { ProjectSummary } from '@/types/contracts';

/**
 * Fetch the paginated projects list.
 *
 * Accepts optional filter/pagination params that are forwarded to
 * GET /projects as query string parameters and included in the React
 * Query cache key — different param combinations get separate entries.
 *
 * When backend Projects contracts are finalised, replace QueryParams with
 * a typed ProjectFilters interface (status, page, limit, search, etc.).
 */
export function useProjects(
  params?: QueryParams,
): UseQueryResult<PaginatedResponse<ProjectSummary>> {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<ProjectSummary>>('/projects', { params }),
    placeholderData: keepPreviousData,
  });
}
