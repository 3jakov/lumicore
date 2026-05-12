import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProjectStatus } from '@lumicore/shared-types';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsDateString()
  start_date?: string | null;

  @IsOptional()
  @IsDateString()
  end_date?: string | null;

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
  @IsString()
  contract_number?: string | null;

  @IsOptional()
  @IsInt()
  @IsPositive()
  project_manager_id?: number | null;

  @IsOptional()
  @IsString()
  client_company_name?: string | null;

  @IsOptional()
  @IsString()
  client_reg_code?: string | null;

  @IsOptional()
  @IsString()
  client_contact_name?: string | null;

  @IsOptional()
  @IsString()
  client_phone?: string | null;

  @IsOptional()
  @IsEmail()
  client_email?: string | null;
}
