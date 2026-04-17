import { IsOptional, IsInt, IsDateString } from 'class-validator';
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
}
