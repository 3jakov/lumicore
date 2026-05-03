import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AbsenceSummary, CreateAbsenceDto } from '@lumicore/shared-types';

export function useMyAbsences() {
  return useQuery<AbsenceSummary[]>({
    queryKey: ['absences', 'my'],
    queryFn: () => apiClient.get<AbsenceSummary[]>('/absences/my'),
  });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAbsenceDto) =>
      apiClient.post<AbsenceSummary>('/absences', { body: dto }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team-timesheet'] });
      void queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
  });
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/absences/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team-timesheet'] });
      void queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
  });
}
