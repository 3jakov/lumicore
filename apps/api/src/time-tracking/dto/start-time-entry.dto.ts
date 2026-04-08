import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * POST /api/v1/time-entries
 * Starts a timer or creates a manual entry.
 *
 * BR-001: project_id null + no no_project_reason (≥10 chars) → 400
 * BR-002: is_manual=true + started_at >= ended_at → 400
 * BR-003: duration is never accepted here — always computed server-side
 */
export class StartTimeEntryDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  project_id?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  task_id?: number | null;

  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'no_project_reason must be at least 10 characters (BR-001)',
  })
  @MaxLength(1000)
  no_project_reason?: string | null;

  @IsOptional()
  @IsBoolean()
  is_manual?: boolean;

  @IsOptional()
  @IsDateString()
  started_at?: string;

  @IsOptional()
  @IsDateString()
  ended_at?: string;
}
