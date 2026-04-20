import { EmployeeGroup } from './enums';

// ─── Internal Document ────────────────────────────────────────────────────────

export interface InternalDocumentSummary {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  s3_key: string;
  version: number;
  requires_ack: boolean;
  uploaded_by_id: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CreateInternalDocumentDto {
  title: string;
  description?: string;
  category?: string;
  s3_key: string;
  requires_ack?: boolean;
}

export interface UpdateInternalDocumentDto {
  title?: string;
  description?: string;
  category?: string;
  /** Providing a new s3_key triggers version increment (BR-017) */
  s3_key?: string;
  requires_ack?: boolean;
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export interface AssignDocumentDto {
  employee_ids?: number[];
  groups?: EmployeeGroup[];
  due_date?: string;
}

export interface DocAckAssignmentSummary {
  id: number;
  document_id: number;
  employee_id: number | null;
  group: EmployeeGroup | null;
  assigned_at: string;
  due_date: string | null;
}

// ─── Acknowledgement ──────────────────────────────────────────────────────────

export interface DocAcknowledgementRecord {
  id: number;
  document_id: number;
  employee_id: number;
  document_version: number;
  acknowledged_at: string;
}

// ─── Status / compliance ──────────────────────────────────────────────────────

export type DocAckStatus = 'acknowledged' | 'pending' | 'overdue';

export interface EmployeeAckStatus {
  employee_id: number;
  employee_name: string;
  status: DocAckStatus;
  acknowledged_at: string | null;
  due_date: string | null;
}

export interface DocumentStatusSummary {
  document_id: number;
  document_version: number;
  assignments: EmployeeAckStatus[];
}

// ─── Employee "my docs" ───────────────────────────────────────────────────────

export interface MyDocumentEntry {
  document_id: number;
  title: string;
  category: string | null;
  s3_key: string;
  /** Signed S3 GET URL — valid for 15 minutes. Use for reading the document. */
  download_url: string;
  version: number;
  acknowledged: boolean;
  acknowledged_at: string | null;
  due_date: string | null;
  overdue: boolean;
}

// ─── S3 upload URL ────────────────────────────────────────────────────────────

export interface InternalDocUploadUrlResponse {
  upload_url: string;
  s3_key: string;
}
