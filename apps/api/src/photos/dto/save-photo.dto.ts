import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNumber,
  MinLength,
} from 'class-validator';

export class SavePhotoDto {
  @IsString()
  @MinLength(1)
  s3_key!: string;

  @IsOptional()
  @IsInt()
  project_id?: number | null;

  @IsOptional()
  @IsInt()
  task_id?: number | null;

  @IsOptional()
  @IsNumber()
  gps_lat?: number | null;

  @IsOptional()
  @IsNumber()
  gps_lng?: number | null;

  @IsDateString()
  taken_at!: string;

  @IsInt()
  file_size_bytes!: number;

  @IsString()
  @MinLength(1)
  original_filename!: string;
}
