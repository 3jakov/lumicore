'use client';

import type { DocAcknowledgementRecord } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type AcknowledgeDocumentState = {
  isAcknowledging: boolean;
  ackError: string | null;
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

  return 'Failed to acknowledge document. Please try again.';
}

export function useAcknowledgeDocument() {
  const [state, setState] = useState<AcknowledgeDocumentState>({
    isAcknowledging: false,
    ackError: null,
  });
  const queryClient = useQueryClient();

  async function acknowledge(documentId: number): Promise<DocAcknowledgementRecord | null> {
    setState({ isAcknowledging: true, ackError: null });

    try {
      const record = await apiClient.post<DocAcknowledgementRecord>(
        `/internal-documents/${documentId}/acknowledge`,
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.docAck.myDocuments });
      setState({ isAcknowledging: false, ackError: null });
      return record;
    } catch (err) {
      setState({ isAcknowledging: false, ackError: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    acknowledge,
  };
}
