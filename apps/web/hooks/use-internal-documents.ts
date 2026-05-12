'use client';

import type { InternalDocumentSummary } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useInternalDocuments(): UseQueryResult<InternalDocumentSummary[]> {
  return useQuery({
    queryKey: queryKeys.docAck.adminList,
    queryFn: () => apiClient.get<InternalDocumentSummary[]>('/internal-documents'),
  });
}
