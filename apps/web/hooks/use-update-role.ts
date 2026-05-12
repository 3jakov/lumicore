'use client';

import type { RoleSummary, UpdateRoleDto } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type UpdateRoleState = {
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

  return 'Failed to update role. Please try again.';
}

export function useUpdateRole() {
  const [state, setState] = useState<UpdateRoleState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function updateRole(id: number, dto: UpdateRoleDto): Promise<RoleSummary | null> {
    setState({ isLoading: true, error: null });

    try {
      const updated = await apiClient.patch<RoleSummary>(`/settings/roles/${id}`, { body: dto });
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
      setState({ isLoading: false, error: null });
      return updated;
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    updateRole,
  };
}
