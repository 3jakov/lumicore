import { PartialType } from '@nestjs/swagger';
import { CreateToolDto } from './create-tool.dto';

/**
 * All fields from CreateToolDto become optional.
 * Inherits all class-validator decorators — validation still applies
 * to any field that IS provided.
 * Semantics: undefined = don't touch; null = clear; value = set.
 */
export class UpdateToolDto extends PartialType(CreateToolDto) {}
