'use client';

import type { DocumentSummary } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useDocuments(projectId: number): UseQueryResult<DocumentSummary[]> {
  return useQuery({
    queryKey: queryKeys.documents.list(projectId),
    queryFn: () =>
      apiClient.get<DocumentSummary[]>('/documents', {
        params: { project_id: projectId },
      }),
  });
}
