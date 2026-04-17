import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/**
 * All fields from CreateProjectDto become optional.
 * Inherits all class-validator decorators — validation still applies
 * to any field that IS provided.
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
