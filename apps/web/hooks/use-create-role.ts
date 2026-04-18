'use client';

import type { CreateRoleDto, RoleSummary } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type CreateRoleState = {
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

  return 'Failed to create role. Please try again.';
}

export function useCreateRole() {
  const [state, setState] = useState<CreateRoleState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function createRole(dto: CreateRoleDto): Promise<RoleSummary | null> {
    setState({ isLoading: true, error: null });

    try {
      const created = await apiClient.post<RoleSummary>('/settings/roles', { body: dto });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
      setState({ isLoading: false, error: null });
      return created;
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    createRole,
  };
}
