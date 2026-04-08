'use client';

import type { TaskDetail, UpdateTaskDto } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type UpdateTaskState = {
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

  return 'Failed to update task. Please try again.';
}

export function useUpdateTask(id: number) {
  const [state, setState] = useState<UpdateTaskState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function updateTask(dto: UpdateTaskDto): Promise<void> {
    setState({ isLoading: true, error: null });

    try {
      const updatedTask = await apiClient.patch<TaskDetail>(`/tasks/${id}`, { body: dto });
      queryClient.setQueryData(queryKeys.tasks.detail(id), updatedTask);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists });
      router.replace(`/tasks/${updatedTask.id}`);
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    updateTask,
  };
}
