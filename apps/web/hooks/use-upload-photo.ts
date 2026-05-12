import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PhotoSummary, PhotoUploadUrlResponse } from '@lumicore/shared-types';
import { apiClient } from '@/lib/api-client';

type UploadParams = {
  file: File;
  project_id?: number;
  task_id?: number;
};

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, project_id, task_id }: UploadParams): Promise<PhotoSummary> => {
      // Step 1: get presigned URL
      const { upload_url, s3_key } = await apiClient.post<PhotoUploadUrlResponse>(
        '/photos/upload-url',
        { params: { filename: file.name } },
      );

      // Step 2: PUT file directly to S3/MinIO (no auth header)
      const s3Resp = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'image/jpeg' },
      });
      if (!s3Resp.ok) throw new Error('Failed to upload file to storage');

      // Step 3: save metadata
      return apiClient.post<PhotoSummary>('/photos', {
        body: {
          s3_key,
          project_id: project_id ?? null,
          task_id: task_id ?? null,
          taken_at: new Date().toISOString(),
          file_size_bytes: file.size,
          original_filename: file.name,
        },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}
