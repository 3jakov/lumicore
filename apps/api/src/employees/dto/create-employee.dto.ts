import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { EmployeeGroup, Language, TimeFormat } from '@lumicore/shared-types';

/**
 * POST /api/v1/employees — Admin: create a new employee record.
 *
 * Note on BR-007 (invitation flow):
 *   If phone or email is provided, an invitation SMS/email should be sent.
 *   The invitation delivery infrastructure is NOT yet implemented.
 *   A TODO stub is present in the service layer; no silent fake completion here.
 */
export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  full_name!: string;

  @IsEnum(EmployeeGroup)
  group!: EmployeeGroup;

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
   * Array of Role IDs to assign via EmployeeRole join table.
   * Roles are resolved on create and inserted transactionally.
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  role_ids?: number[];
}
