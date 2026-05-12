export interface DocumentSummary {
  id: number;
  project_id: number;
  s3_key: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_by_id: number;
  uploaded_at: string;
  /** Signed download URL — generated server-side */
  download_url: string;
}

export interface SaveDocumentDto {
  project_id: number;
  s3_key: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
}

export interface DocumentUploadUrlResponse {
  upload_url: string;
  s3_key: string;
}
