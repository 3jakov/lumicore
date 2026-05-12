'use client';

import type { MyDocumentEntry } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useMyDocuments(): UseQueryResult<MyDocumentEntry[]> {
  return useQuery({
    queryKey: queryKeys.docAck.myDocuments,
    queryFn: () => apiClient.get<MyDocumentEntry[]>('/internal-documents/my'),
  });
}
