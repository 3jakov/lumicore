'use client';

import type { AssignDocumentDto, DocAckAssignmentSummary } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type AssignDocumentState = {
  isAssigning: boolean;
  assignError: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const message =
      'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : null;

    if (message) return message;
  }

  return 'Failed to assign document. Please try again.';
}

export function useAssignDocument() {
  const [state, setState] = useState<AssignDocumentState>({
    isAssigning: false,
    assignError: null,
  });
  const queryClient = useQueryClient();

  async function assignDocument(
    documentId: number,
    dto: AssignDocumentDto,
  ): Promise<DocAckAssignmentSummary[] | null> {
    setState({ isAssigning: true, assignError: null });

    try {
      const assignments = await apiClient.post<DocAckAssignmentSummary[]>(
        `/internal-documents/${documentId}/assign`,
        { body: dto },
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.docAck.adminStatus(documentId),
      });
      setState({ isAssigning: false, assignError: null });
      return assignments;
    } catch (err) {
      setState({ isAssigning: false, assignError: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    assignDocument,
  };
}
