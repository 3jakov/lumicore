import { IsArray, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { EmployeeGroup } from '@lumicore/shared-types';

export class AssignDocumentDto {
  @IsOptional()
  @IsArray()
  employee_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsEnum(EmployeeGroup, { each: true })
  groups?: EmployeeGroup[];

  @IsOptional()
  @IsDateString()
  due_date?: string;
}
