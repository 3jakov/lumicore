import { IsString, IsInt, MinLength } from 'class-validator';

export class SaveDocumentDto {
  @IsInt()
  project_id!: number;

  @IsString()
  @MinLength(1)
  s3_key!: string;

  @IsString()
  @MinLength(1)
  original_filename!: string;

  @IsString()
  @MinLength(1)
  mime_type!: string;

  @IsInt()
  file_size_bytes!: number;
}
