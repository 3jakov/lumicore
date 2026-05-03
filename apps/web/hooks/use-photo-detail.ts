import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { PhotoDetail } from '@lumicore/shared-types';
import { apiClient } from '@/lib/api-client';

export function usePhotoDetail(id: number | null): UseQueryResult<PhotoDetail> {
  return useQuery({
    queryKey: ['photos', 'detail', id],
    queryFn: () => apiClient.get<PhotoDetail>(`/photos/${id}`),
    enabled: id !== null,
  });
}
