import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';
import type { AbsenceSummary, CreateAbsenceDto } from '@lumicore/shared-types';

export function useMyAbsences() {
  return useQuery<AbsenceSummary[]>({
    queryKey: queryKeys.absences.my,
    queryFn: () => apiClient.get<AbsenceSummary[]>('/absences/my'),
  });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAbsenceDto) =>
      apiClient.post<AbsenceSummary>('/absences', { body: dto }),
    onSuccess: () => {
      // Invalidate all team timesheet variants (any date range)
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.timesheets });
      void queryClient.invalidateQueries({ queryKey: queryKeys.absences.all });
    },
  });
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<void>(`/absences/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.timesheets });
      void queryClient.invalidateQueries({ queryKey: queryKeys.absences.all });
    },
  });
}
