'use client';

import type { DocumentStatusSummary } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useDocumentStatus(documentId: number): UseQueryResult<DocumentStatusSummary> {
  return useQuery({
    queryKey: queryKeys.docAck.adminStatus(documentId),
    queryFn: () => apiClient.get<DocumentStatusSummary>(`/internal-documents/${documentId}/status`),
    enabled: documentId > 0,
  });
}
