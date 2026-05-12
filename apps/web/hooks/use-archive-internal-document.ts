'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type ArchiveInternalDocumentState = {
  isArchiving: boolean;
  archiveError: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const message =
      'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : null;

    if (message) return message;
  }

  return 'Failed to archive internal document. Please try again.';
}

export function useArchiveInternalDocument() {
  const [state, setState] = useState<ArchiveInternalDocumentState>({
    isArchiving: false,
    archiveError: null,
  });
  const queryClient = useQueryClient();

  async function archiveDocument(id: number): Promise<boolean> {
    setState({ isArchiving: true, archiveError: null });

    try {
      await apiClient.delete<void>(`/internal-documents/${id}`);
      await queryClient.invalidateQueries({ queryKey: queryKeys.docAck.adminList });
      setState({ isArchiving: false, archiveError: null });
      return true;
    } catch (err) {
      setState({ isArchiving: false, archiveError: getErrorMessage(err) });
      return false;
    }
  }

  return {
    ...state,
    archiveDocument,
  };
}
