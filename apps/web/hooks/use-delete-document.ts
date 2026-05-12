'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type DeleteDocumentState = {
  isDeleting: boolean;
  deleteError: string | null;
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

  return 'Failed to delete document. Please try again.';
}

export function useDeleteDocument() {
  const [state, setState] = useState<DeleteDocumentState>({
    isDeleting: false,
    deleteError: null,
  });
  const queryClient = useQueryClient();

  async function deleteDocument(id: number, projectId: number): Promise<boolean> {
    setState({ isDeleting: true, deleteError: null });

    try {
      await apiClient.delete<void>(`/documents/${id}`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents.list(projectId) });
      setState({ isDeleting: false, deleteError: null });
      return true;
    } catch (err) {
      setState({ isDeleting: false, deleteError: getErrorMessage(err) });
      return false;
    }
  }

  return {
    ...state,
    deleteDocument,
  };
}
