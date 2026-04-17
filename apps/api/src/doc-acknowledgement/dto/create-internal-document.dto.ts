import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateInternalDocumentDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  @MinLength(1)
  s3_key!: string;

  @IsOptional()
  @IsBoolean()
  requires_ack?: boolean;
}
