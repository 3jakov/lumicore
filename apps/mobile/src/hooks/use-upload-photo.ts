import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PhotoSummary, PhotoUploadUrlResponse, SavePhotoDto } from '@lumicore/shared-types';

export interface UploadPhotoParams {
  /** Local file URI returned by takePictureAsync */
  uri: string;
  /** ISO 8601 — moment the shutter was pressed */
  takenAt: string;
  projectId?: number | null;
  taskId?: number | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
}

async function doUpload(params: UploadPhotoParams): Promise<PhotoSummary> {
  const filename = `photo_${Date.now()}.jpg`;

  // ── Step 1: get presigned S3 PUT URL ──────────────────────────────────────
  const { upload_url, s3_key } = await apiClient.post<PhotoUploadUrlResponse>(
    `/photos/upload-url?filename=${encodeURIComponent(filename)}`,
  );

  // ── Step 2: read local URI as blob and PUT to S3 (no auth header) ─────────
  const localRes = await fetch(params.uri);
  const blob = await localRes.blob();

  const s3Res = await fetch(upload_url, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  });
  if (!s3Res.ok) {
    throw new Error(`S3 upload failed (${s3Res.status})`);
  }

  // ── Step 3: save metadata ─────────────────────────────────────────────────
  const dto: SavePhotoDto = {
    s3_key,
    project_id: params.projectId ?? null,
    task_id: params.taskId ?? null,
    gps_lat: params.gpsLat ?? null,
    gps_lng: params.gpsLng ?? null,
    taken_at: params.takenAt,
    file_size_bytes: blob.size,
    original_filename: filename,
  };

  return apiClient.post<PhotoSummary>('/photos', { body: dto });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation<PhotoSummary, Error, UploadPhotoParams>({
    mutationFn: doUpload,
    onSuccess: () => {
      // Invalidate any cached photo list so gallery reflects new photo
      qc.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}
