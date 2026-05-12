export interface PhotoCommentSummary {
  id: number;
  photo_id: number;
  author_id: number;
  author_name: string;
  author_initials: string;
  author_avatar_color: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface PhotoSummary {
  id: number;
  s3_key: string;
  thumbnail_s3_key: string | null;
  project_id: number | null;
  project_name: string | null;
  task_id: number | null;
  author_id: number;
  author_name: string;
  author_initials: string;
  author_avatar_color: string;
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
  comment_count: number;
}

export interface PhotoDetail extends PhotoSummary {
  comments: PhotoCommentSummary[];
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

export interface CreatePhotoCommentDto {
  text: string;
}

export interface PhotoListResponse {
  data: PhotoSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
