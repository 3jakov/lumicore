import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ReportDetailQueryDto {
  @IsNotEmpty()
  @IsDateString()
  date_from!: string;

  @IsNotEmpty()
  @IsDateString()
  date_to!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employee_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  project_id?: number;

  /** When true, returns only entries without a project (no_project_reason set). */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  unassigned_only?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
