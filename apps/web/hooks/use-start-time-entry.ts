'use client';

import type { StartTimeEntryDto, TimeEntryDetail } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type StartTimeEntryState = {
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

  return 'Failed to start time entry. Please try again.';
}

export function useStartTimeEntry() {
  const [state, setState] = useState<StartTimeEntryState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function startTimeEntry(dto: StartTimeEntryDto): Promise<TimeEntryDetail | null> {
    setState({ isLoading: true, error: null });

    try {
      const created = await apiClient.post<TimeEntryDetail>('/time-entries', { body: dto });
      queryClient.setQueryData(queryKeys.timeEntries.detail(created.id), created);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.lists }),
        queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.timesheets }),
      ]);
      setState({ isLoading: false, error: null });
      return created;
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    startTimeEntry,
  };
}
