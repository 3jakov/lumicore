import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

/**
 * All fields from CreateTaskDto become optional.
 * Inherits all class-validator decorators — validation still applies
 * to any field that IS provided.
 *
 * Nullable semantics:
 *   undefined   = don't touch the field
 *   null        = clear the field
 *   value       = set the field
 *
 * assignee_ids semantics:
 *   undefined   = leave assignees untouched
 *   []          = remove all assignees
 *   [1, 2, ...] = replace assignees with exactly this set
 */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
