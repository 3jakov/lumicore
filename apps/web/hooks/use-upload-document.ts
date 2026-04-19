'use client';

import type {
  DocumentSummary,
  DocumentUploadUrlResponse,
  SaveDocumentDto,
} from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type UploadDocumentState = {
  isUploading: boolean;
  uploadError: string | null;
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

  return 'Failed to upload document. Please try again.';
}

export function useUploadDocument() {
  const [state, setState] = useState<UploadDocumentState>({
    isUploading: false,
    uploadError: null,
  });
  const queryClient = useQueryClient();

  async function uploadDocument(file: File, projectId: number): Promise<DocumentSummary | null> {
    setState({ isUploading: true, uploadError: null });

    try {
      const { upload_url, s3_key } = await apiClient.post<DocumentUploadUrlResponse>(
        '/documents/upload-url',
        { params: { filename: file.name } },
      );

      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage.');
      }

      const body = {
        project_id: projectId,
        s3_key,
        original_filename: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size,
      } satisfies SaveDocumentDto;

      const document = await apiClient.post<DocumentSummary>('/documents', { body });
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents.list(projectId) });
      setState({ isUploading: false, uploadError: null });
      return document;
    } catch (err) {
      setState({ isUploading: false, uploadError: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    uploadDocument,
  };
}
