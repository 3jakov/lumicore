import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Language, TimeFormat } from '@lumicore/shared-types';

export class UpdateOwnProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  full_name?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(TimeFormat)
  time_format?: TimeFormat;
}
