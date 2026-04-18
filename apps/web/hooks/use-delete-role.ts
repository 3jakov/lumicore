'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type DeleteRoleState = {
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

    if (statusCode === 409) {
      return 'Role is assigned to employees and cannot be deleted.';
    }

    if (message) {
      return message;
    }
  }

  return 'Failed to delete role. Please try again.';
}

export function useDeleteRole() {
  const [state, setState] = useState<DeleteRoleState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();

  async function deleteRole(id: number): Promise<boolean> {
    setState({ isLoading: true, error: null });

    try {
      await apiClient.delete<void>(`/settings/roles/${id}`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
      setState({ isLoading: false, error: null });
      return true;
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
      return false;
    }
  }

  return {
    ...state,
    deleteRole,
  };
}
