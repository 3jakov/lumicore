import { IsOptional, IsInt, IsDateString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPhotosDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  project_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  author_id?: number;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 30;
}
