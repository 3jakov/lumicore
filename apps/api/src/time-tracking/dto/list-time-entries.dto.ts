import { IsDateString, IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/v1/time-entries
 * Query parameters for filtering the authenticated employee's own entries.
 */
export class ListTimeEntriesDto {
  /** Filter entries from this date (ISO 8601 date string, inclusive). */
  @IsOptional()
  @IsDateString()
  date_from?: string;

  /** Filter entries until this date (ISO 8601 date string, inclusive). */
  @IsOptional()
  @IsDateString()
  date_to?: string;

  /** Filter by project. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  project_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
