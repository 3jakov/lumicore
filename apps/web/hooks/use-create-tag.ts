'use client';

import type { CreateTagDto, TagSummary } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type CreateTagState = {
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

  return 'Failed to create tag. Please try again.';
}

export function useCreateTag() {
  const [state, setState] = useState<CreateTagState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function createTag(dto: CreateTagDto): Promise<TagSummary | null> {
    setState({ isLoading: true, error: null });

    try {
      const created = await apiClient.post<TagSummary>('/settings/tags', { body: dto });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.tags }),
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.tagsFiltered(dto.entity_type) }),
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
    createTag,
  };
}
