'use client';

import type {
  InternalDocumentSummary,
  UpdateInternalDocumentDto,
} from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';
import { uploadInternalDocumentFile } from './use-create-internal-document';

type UpdateInternalDocumentState = {
  isUpdating: boolean;
  updateError: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const message =
      'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : null;

    if (message) return message;
  }

  return 'Failed to update internal document. Please try again.';
}

export function useUpdateInternalDocument() {
  const [state, setState] = useState<UpdateInternalDocumentState>({
    isUpdating: false,
    updateError: null,
  });
  const queryClient = useQueryClient();

  async function updateDocument(
    id: number,
    dto: UpdateInternalDocumentDto,
    file?: File | null,
  ): Promise<InternalDocumentSummary | null> {
    setState({ isUpdating: true, updateError: null });

    try {
      const s3Key = file ? await uploadInternalDocumentFile(file) : null;
      const updated = await apiClient.patch<InternalDocumentSummary>(`/internal-documents/${id}`, {
        body: {
          ...dto,
          ...(s3Key ? { s3_key: s3Key } : {}),
        } satisfies UpdateInternalDocumentDto,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.docAck.adminList }),
        queryClient.invalidateQueries({ queryKey: queryKeys.docAck.adminStatus(id) }),
      ]);
      setState({ isUpdating: false, updateError: null });
      return updated;
    } catch (err) {
      setState({ isUpdating: false, updateError: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    updateDocument,
  };
}
