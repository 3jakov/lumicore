import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { PhotoListResponse } from '@lumicore/shared-types';
import { apiClient } from '@/lib/api-client';

type Params = {
  project_id?: number;
  author_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
};

export function usePhotos(params: Params = {}): UseQueryResult<PhotoListResponse> {
  return useQuery({
    queryKey: ['photos', params],
    queryFn: () =>
      apiClient.get<PhotoListResponse>('/photos', {
        params: {
          project_id: params.project_id,
          author_id: params.author_id,
          date_from: params.date_from,
          date_to: params.date_to,
          page: params.page ?? 1,
          limit: params.limit ?? 30,
        },
      }),
  });
}
