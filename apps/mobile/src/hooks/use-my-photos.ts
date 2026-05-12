import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PhotoListResponse } from '@lumicore/shared-types';
import { useAuthStore } from '@/store/auth.store';

export function useMyPhotos() {
  const userId = useAuthStore((s) => s.currentUser?.id);
  return useQuery({
    queryKey: ['photos', 'mine', userId],
    queryFn: () =>
      apiClient.get<PhotoListResponse>(
        `/photos?author_id=${userId}&limit=40`,
      ),
    enabled: userId != null,
    staleTime: 30_000,
  });
}
