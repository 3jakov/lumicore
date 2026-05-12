'use client';

import type { CreateTaskDto, TaskDetail } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type CreateTaskState = {
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

  return 'Failed to create task. Please try again.';
}

export function useCreateTask() {
  const [state, setState] = useState<CreateTaskState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function createTask(dto: CreateTaskDto): Promise<void> {
    setState({ isLoading: true, error: null });

    try {
      const created = await apiClient.post<TaskDetail>('/tasks', { body: dto });
      queryClient.setQueryData(queryKeys.tasks.detail(created.id), created);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists });
      router.replace(`/tasks/${created.id}`);
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    createTask,
  };
}
