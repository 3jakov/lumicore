'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type ArchiveProjectResponse = {
  id: number;
};

type ArchiveProjectState = {
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
      return 'Only administrators can archive projects.';
    }

    if (message) {
      return message;
    }
  }

  return 'Failed to archive project. Please try again.';
}

export function useArchiveProject(id: number) {
  const [state, setState] = useState<ArchiveProjectState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function archiveProject(): Promise<void> {
    setState({ isLoading: true, error: null });

    try {
      await apiClient.delete<ArchiveProjectResponse>(`/projects/${id}`);
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists });
      router.replace('/projects');
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    archiveProject,
  };
}
