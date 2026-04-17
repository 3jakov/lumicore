export interface PhotoSummary {
  id: number;
  s3_key: string;
  thumbnail_s3_key: string | null;
  project_id: number | null;
  task_id: number | null;
  author_id: number;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_verified: boolean;
  taken_at: string;
  uploaded_at: string;
  file_size_bytes: number;
  original_filename: string;
  /** Signed read URL — generated server-side, not stored */
  url: string;
  thumbnail_url: string | null;
}

export interface SavePhotoDto {
  s3_key: string;
  project_id?: number | null;
  task_id?: number | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  taken_at: string;
  file_size_bytes: number;
  original_filename: string;
}

export interface PhotoUploadUrlResponse {
  upload_url: string;
  s3_key: string;
}
