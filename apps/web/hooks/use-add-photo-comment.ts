import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PhotoCommentSummary } from '@lumicore/shared-types';
import { apiClient } from '@/lib/api-client';

export function useAddPhotoComment(photoId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) =>
      apiClient.post<PhotoCommentSummary>(`/photos/${photoId}/comments`, {
        body: { text },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photos', 'detail', photoId] });
      void queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}
