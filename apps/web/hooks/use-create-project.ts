'use client';

import type { CreateProjectDto, ProjectDetail } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type CreateProjectState = {
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
      return 'Only administrators can create new projects.';
    }

    if (message) {
      return message;
    }
  }

  return 'Failed to create project. Please try again.';
}

export function useCreateProject() {
  const [state, setState] = useState<CreateProjectState>({ isLoading: false, error: null });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function createProject(dto: CreateProjectDto): Promise<void> {
    setState({ isLoading: true, error: null });

    try {
      const created = await apiClient.post<ProjectDetail>('/projects', { body: dto });
      queryClient.setQueryData(queryKeys.projects.detail(created.id), created);
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      router.replace(`/projects/${created.id}`);
    } catch (err) {
      setState({ isLoading: false, error: getErrorMessage(err) });
    }
  }

  return {
    ...state,
    createProject,
  };
}
