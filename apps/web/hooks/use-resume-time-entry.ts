'use client';

import type { ResumeTimeEntryResponse } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type ResumeTimeEntryState = {
  isLoading: boolean;
  error: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const message =
      'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : null;

    if (message) {
      return message;
    }
  }

  return 'Failed to resume time entry. Please try again.';
}

export function useResumeTimeEntry() {
  const [state, setState] = useState<ResumeTimeEntryState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function resumeTimeEntry(id: number): Promise<ResumeTimeEntryResponse | null> {
    setState({ isLoading: true, error: null });

    try {
      const updated = await apiClient.post<ResumeTimeEntryResponse>(`/time-entries/${id}/resume`);
      queryClient.setQueryData(queryKeys.timeEntries.detail(id), updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.lists }),
        queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.timesheets }),
      ]);
      setState({ isLoading: false, error: null });
      return updated;
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    resumeTimeEntry,
  };
}
