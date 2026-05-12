import { IsEnum, IsOptional } from 'class-validator';
import { TagEntityType } from '@lumicore/shared-types';

export class ListTagsDto {
  @IsOptional()
  @IsEnum(TagEntityType)
  entity_type?: TagEntityType;
}
