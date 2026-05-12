'use client';

import { TagEntityType } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type DeleteTagState = {
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

  return 'Failed to delete tag. Please try again.';
}

export function useDeleteTag() {
  const [state, setState] = useState<DeleteTagState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function deleteTag(id: number, entityType: TagEntityType): Promise<boolean> {
    setState({ isLoading: true, error: null });

    try {
      await apiClient.delete<void>(`/settings/tags/${id}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.tags }),
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.tagsFiltered(entityType) }),
      ]);
      setState({ isLoading: false, error: null });
      return true;
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
      return false;
    }
  }

  return {
    ...state,
    deleteTag,
  };
}
