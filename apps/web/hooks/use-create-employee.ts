'use client';

import type { CreateEmployeeDto, EmployeeDetail } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type CreateEmployeeState = {
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
      return 'Only administrators can create employees.';
    }

    if (message) {
      return message;
    }
  }

  return 'Failed to create employee. Please try again.';
}

export function useCreateEmployee() {
  const [state, setState] = useState<CreateEmployeeState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function createEmployee(dto: CreateEmployeeDto): Promise<void> {
    setState({ isLoading: true, error: null });

    try {
      const created = await apiClient.post<EmployeeDetail>('/employees', { body: dto });
      queryClient.setQueryData(queryKeys.employees.detail(created.id), created);
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists });
      router.replace(`/team/people/${created.id}`);
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    createEmployee,
  };
}
