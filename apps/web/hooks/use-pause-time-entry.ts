'use client';

import type { PauseTimeEntryResponse } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type PauseTimeEntryState = {
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

  return 'Failed to pause time entry. Please try again.';
}

export function usePauseTimeEntry() {
  const [state, setState] = useState<PauseTimeEntryState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function pauseTimeEntry(id: number): Promise<PauseTimeEntryResponse | null> {
    setState({ isLoading: true, error: null });

    try {
      const updated = await apiClient.post<PauseTimeEntryResponse>(`/time-entries/${id}/pause`);
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
    pauseTimeEntry,
  };
}
