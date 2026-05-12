'use client';

import type { StopTimeEntryResponse } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type StopTimeEntryState = {
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

  return 'Failed to stop time entry. Please try again.';
}

export function useStopTimeEntry() {
  const [state, setState] = useState<StopTimeEntryState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function stopTimeEntry(id: number): Promise<StopTimeEntryResponse | null> {
    setState({ isLoading: true, error: null });

    try {
      const updated = await apiClient.post<StopTimeEntryResponse>(`/time-entries/${id}/stop`);
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
    stopTimeEntry,
  };
}
