'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type ArchiveTaskResponse = {
  id: number;
};

type ArchiveTaskState = {
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
      return 'Only administrators can archive tasks.';
    }

    if (message) {
      return message;
    }
  }

  return 'Failed to archive task. Please try again.';
}

export function useArchiveTask(id: number) {
  const [state, setState] = useState<ArchiveTaskState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function archiveTask(): Promise<void> {
    setState({ isLoading: true, error: null });

    try {
      await apiClient.delete<ArchiveTaskResponse>(`/tasks/${id}`);
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists });
      router.replace('/tasks');
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    archiveTask,
  };
}
