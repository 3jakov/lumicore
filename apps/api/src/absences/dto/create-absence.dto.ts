import { IsEnum, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { AbsenceType } from '@prisma/client';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateAbsenceDto {
  @IsInt()
  employee_id!: number;

  @IsEnum(AbsenceType)
  type!: AbsenceType;

  @Matches(DATE_REGEX, { message: 'date_from must be YYYY-MM-DD' })
  date_from!: string;

  @Matches(DATE_REGEX, { message: 'date_to must be YYYY-MM-DD' })
  date_to!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
