import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { EmployeeGroup, EmployeeStatus, Language, TimeFormat } from '@lumicore/shared-types';

/**
 * PATCH /api/v1/employees/:id — Admin: update another employee's profile.
 *
 * Intentionally broader than UpdateOwnProfileDto (PATCH /me).
 * Covers all admin-managed staff fields supported by the Employee schema.
 *
 * Note on BR-007 (invitation flow):
 *   If phone or email is set for the first time via this endpoint,
 *   an invitation should be triggered. Not yet implemented — see service stub.
 */
export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  full_name?: string;

  @IsOptional()
  @IsEnum(EmployeeGroup)
  group?: EmployeeGroup;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(TimeFormat)
  time_format?: TimeFormat;

  @IsOptional()
  @IsString()
  work_schedule?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  norm_hours_per_week?: number;

  @IsOptional()
  @IsBoolean()
  project_access_all?: boolean;

  @IsOptional()
  @IsString()
  additional_info?: string;

  // ─── Admin-only HR fields ─────────────────────────────────────────────────

  /** Decimal string, e.g. "18.50". Stored as Prisma Decimal(10,2). */
  @IsOptional()
  @IsString()
  hourly_rate?: string;

  @IsOptional()
  @IsString()
  personal_id?: string;

  /** ISO date string "YYYY-MM-DD". */
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  // ─── Role assignment ──────────────────────────────────────────────────────

  /**
   * Full replacement of role assignments via EmployeeRole join table.
   * Passing an empty array removes all roles. Omitting the field leaves roles unchanged.
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  role_ids?: number[];
}
