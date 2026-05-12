import type { AbsenceType } from './enums';

export interface AbsenceSummary {
  id: number;
  employee_id: number;
  employee_name: string;
  type: AbsenceType;
  /** Short display code: "Б", "СД", "ОО", etc. */
  code: string;
  date_from: string; // YYYY-MM-DD
  date_to: string; // YYYY-MM-DD
  comment: string | null;
  reduces_norm_hours: boolean;
  created_at: string; // ISO 8601
}

export interface CreateAbsenceDto {
  employee_id: number;
  type: AbsenceType;
  date_from: string; // YYYY-MM-DD
  date_to: string; // YYYY-MM-DD
  comment?: string;
}
