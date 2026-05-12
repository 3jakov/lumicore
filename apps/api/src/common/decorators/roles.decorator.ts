import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Declares which roles are required to access a route.
 * Usage: @Roles('Administraator') or @Roles('Administraator', 'Projektijuht')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
