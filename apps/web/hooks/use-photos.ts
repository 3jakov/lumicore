'use client';

import type { PhotoSummary } from '@lumicore/shared-types';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function usePhotos(projectId: number): UseQueryResult<PhotoSummary[]> {
  return useQuery({
    queryKey: queryKeys.photos.list(projectId),
    queryFn: () =>
      apiClient.get<PhotoSummary[]>('/photos', {
        params: { project_id: projectId },
      }),
  });
}
