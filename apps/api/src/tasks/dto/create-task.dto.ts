import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Priority, TaskStatus } from '@lumicore/shared-types';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsInt()
  @IsPositive()
  project_id?: number | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  template_id?: number | null;

  @IsOptional()
  @IsDateString()
  start_time?: string | null;

  @IsOptional()
  @IsDateString()
  end_time?: string | null;

  @IsOptional()
  @IsString()
  location_address?: string | null;

  @IsOptional()
  @IsNumber()
  location_lat?: number | null;

  @IsOptional()
  @IsNumber()
  location_lng?: number | null;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  assignee_ids?: number[];
}
