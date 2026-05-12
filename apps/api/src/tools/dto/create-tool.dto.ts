import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ToolStatus } from '@lumicore/shared-types';

export class CreateToolDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string | null;

  @IsOptional()
  @IsString()
  photo_s3_key?: string | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  current_location_project_id?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  current_location_text?: string | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  responsible_employee_id?: number | null;

  @IsOptional()
  @IsEnum(ToolStatus)
  status?: ToolStatus;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  manufacturer?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string | null;
}
