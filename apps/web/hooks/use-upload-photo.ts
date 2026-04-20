'use client';

import type { PhotoSummary, PhotoUploadUrlResponse } from '@lumicore/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/query-keys';

type UploadPhotoState = {
  isUploading: boolean;
  uploadError: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const message =
      'message' in err && typeof (err as { message?: unknown }).message === 'string'
        ? (err as { message: string }).message
        : null;
    if (message) return message;
  }
  return 'Failed to upload photo. Please try again.';
}

export function useUploadPhoto() {
  const [state, setState] = useState<UploadPhotoState>({
    isUploading: false,
    uploadError: null,
  });
  const queryClient = useQueryClient();

  async function uploadPhoto(file: File, projectId: number): Promise<PhotoSummary | null> {
    setState({ isUploading: true, uploadError: null });

    try {
      // Step 1: get presigned S3 PUT URL
      const { upload_url, s3_key } = await apiClient.post<PhotoUploadUrlResponse>(
        '/photos/upload-url',
        { params: { filename: file.name } },
      );

      // Step 2: PUT directly to S3 — no Authorization header
      const s3Response = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'image/jpeg' },
      });

      if (!s3Response.ok) {
        throw new Error('Failed to upload photo to storage.');
      }

      // Step 3: save metadata
      const photo = await apiClient.post<PhotoSummary>('/photos', {
        body: {
          s3_key,
          project_id: projectId,
          taken_at: new Date().toISOString(),
          file_size_bytes: file.size,
          original_filename: file.name,
        },
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.photos.list(projectId) });
      setState({ isUploading: false, uploadError: null });
      return photo;
    } catch (err) {
      setState({ isUploading: false, uploadError: getErrorMessage(err) });
      return null;
    }
  }

  return {
    ...state,
    uploadPhoto,
  };
}
