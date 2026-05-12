import { IsISO8601, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAbsencesDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  employee_id?: number;

  @IsOptional()
  @IsISO8601()
  date_from?: string;

  @IsOptional()
  @IsISO8601()
  date_to?: string;
}
