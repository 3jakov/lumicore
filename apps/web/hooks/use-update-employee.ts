'use client';

import type { EmployeeDetail, UpdateEmployeeDto } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type UpdateEmployeeState = {
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
      return 'Only administrators can update employees.';
    }

    if (message) {
      return message;
    }
  }

  return 'Failed to update employee. Please try again.';
}

export function useUpdateEmployee(id: number) {
  const [state, setState] = useState<UpdateEmployeeState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function updateEmployee(dto: UpdateEmployeeDto): Promise<void> {
    setState({ isLoading: true, error: null });

    try {
      const updated = await apiClient.patch<EmployeeDetail>(`/employees/${id}`, { body: dto });
      queryClient.setQueryData(queryKeys.employees.detail(updated.id), updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists });
      router.replace(`/team/people/${updated.id}`);
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    updateEmployee,
  };
}
