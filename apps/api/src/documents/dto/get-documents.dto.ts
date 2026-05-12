import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDocumentsDto {
  @IsInt()
  @Type(() => Number)
  project_id!: number;
}
