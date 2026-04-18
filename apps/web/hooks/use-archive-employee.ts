'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type ArchiveEmployeeResponse = {
  id: number;
};

type ArchiveEmployeeState = {
  isLoading: boolean;
  error: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const statusCode =
      'statusCode' in err && typeof (err as { statusCode?: unknown }).statusCode === 'number'
        ? (err as { statusCode: number }).statusCode
        : null;
    const message =
      'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : null;

    if (statusCode === 403) {
      return 'Only administrators can archive employees.';
    }

    if (message) {
      return message;
    }
  }

  return 'Failed to archive employee. Please try again.';
}

export function useArchiveEmployee(id: number) {
  const [state, setState] = useState<ArchiveEmployeeState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function archiveEmployee(): Promise<void> {
    setState({ isLoading: true, error: null });

    try {
      await apiClient.post<ArchiveEmployeeResponse>(`/employees/${id}/archive`);
      queryClient.removeQueries({ queryKey: queryKeys.employees.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists });
      router.replace('/team/people');
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    archiveEmployee,
  };
}
