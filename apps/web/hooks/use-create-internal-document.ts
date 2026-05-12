'use client';

import type {
  CreateInternalDocumentDto,
  InternalDocUploadUrlResponse,
  InternalDocumentSummary,
} from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type CreateInternalDocumentInput = Omit<CreateInternalDocumentDto, 's3_key'>;

type CreateInternalDocumentState = {
  isCreating: boolean;
  createError: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const message =
      'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : null;

    if (message) return message;
  }

  return 'Failed to create internal document. Please try again.';
}

async function uploadInternalDocumentFile(file: File): Promise<string> {
  const { upload_url, s3_key } = await apiClient.post<InternalDocUploadUrlResponse>(
    '/internal-documents/upload-url',
  );

  const response = await fetch(upload_url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to storage.');
  }

  return s3_key;
}

export function useCreateInternalDocument() {
  const [state, setState] = useState<CreateInternalDocumentState>({
    isCreating: false,
    createError: null,
  });
  const queryClient = useQueryClient();

  async function createDocument(
    file: File,
    dto: CreateInternalDocumentInput,
  ): Promise<InternalDocumentSummary | null> {
    setState({ isCreating: true, createError: null });

    try {
      const s3Key = await uploadInternalDocumentFile(file);
      const created = await apiClient.post<InternalDocumentSummary>('/internal-documents', {
        body: {
          ...dto,
          s3_key: s3Key,
        } satisfies CreateInternalDocumentDto,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.docAck.adminList });
      setState({ isCreating: false, createError: null });
      return created;
    } catch (err) {
      setState({ isCreating: false, createError: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    createDocument,
  };
}

export { uploadInternalDocumentFile };
