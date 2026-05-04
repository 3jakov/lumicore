import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationSummary } from '@lumicore/shared-types';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.mine,
    queryFn: () => apiClient.get<NotificationSummary[]>('/notifications'),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.patch<NotificationSummary>(`/notifications/${id}/read`),
    onSuccess: (notification) => {
      queryClient.setQueryData<NotificationSummary[]>(
        queryKeys.notifications.mine,
        (current) =>
          current?.map((item) => (item.id === notification.id ? notification : item)) ?? [
            notification,
          ],
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.mine });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.patch<void>('/notifications/read-all'),
    onSuccess: () => {
      const readAt = new Date().toISOString();
      queryClient.setQueryData<NotificationSummary[]>(
        queryKeys.notifications.mine,
        (current) => current?.map((item) => ({ ...item, read_at: item.read_at ?? readAt })),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.mine });
    },
  });
}
