'use client';

import type { TagSummary, UpdateTagDto } from '@lumicore/shared-types';
import { TagEntityType } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type UpdateTagState = {
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

  return 'Failed to update tag. Please try again.';
}

export function useUpdateTag() {
  const [state, setState] = useState<UpdateTagState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function updateTag(
    id: number,
    entityType: TagEntityType,
    dto: UpdateTagDto,
  ): Promise<TagSummary | null> {
    setState({ isLoading: true, error: null });

    try {
      const updated = await apiClient.patch<TagSummary>(`/settings/tags/${id}`, { body: dto });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.tags }),
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.tagsFiltered(entityType) }),
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
    updateTag,
  };
}
