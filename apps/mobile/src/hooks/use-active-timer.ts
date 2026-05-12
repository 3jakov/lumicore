import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { TimeEntryDetail, StartTimeEntryDto } from '@lumicore/shared-types';

const ACTIVE_TIMER_KEY = ['time-entries', 'active'] as const;

// ─── Query ────────────────────────────────────────────────────────────────────

export function useActiveTimer() {
  return useQuery<TimeEntryDetail | null>({
    queryKey: ACTIVE_TIMER_KEY,
    queryFn: () => apiClient.get<TimeEntryDetail | null>('/time-entries/active'),
    // Poll every 30 s as a safety net (WS is out of scope for M1)
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation<TimeEntryDetail, Error, StartTimeEntryDto>({
    mutationFn: (dto) => apiClient.post<TimeEntryDetail>('/time-entries', { body: dto }),
    onSuccess: (entry) => {
      qc.setQueryData(ACTIVE_TIMER_KEY, entry);
    },
  });
}

// ─── Pause ────────────────────────────────────────────────────────────────────

export function usePauseTimer() {
  const qc = useQueryClient();
  return useMutation<TimeEntryDetail, Error, number>({
    mutationFn: (id) => apiClient.post<TimeEntryDetail>(`/time-entries/${id}/pause`),
    onSuccess: (entry) => {
      qc.setQueryData(ACTIVE_TIMER_KEY, entry);
    },
  });
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export function useResumeTimer() {
  const qc = useQueryClient();
  return useMutation<TimeEntryDetail, Error, number>({
    mutationFn: (id) => apiClient.post<TimeEntryDetail>(`/time-entries/${id}/resume`),
    onSuccess: (entry) => {
      qc.setQueryData(ACTIVE_TIMER_KEY, entry);
    },
  });
}

// ─── Stop ─────────────────────────────────────────────────────────────────────

export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation<TimeEntryDetail, Error, number>({
    mutationFn: (id) => apiClient.post<TimeEntryDetail>(`/time-entries/${id}/stop`),
    onSuccess: () => {
      qc.setQueryData(ACTIVE_TIMER_KEY, null);
    },
  });
}
