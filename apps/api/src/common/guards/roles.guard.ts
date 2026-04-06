import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUser } from '@lumicore/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Checks that the authenticated user has at least one of the required roles.
 * Must be used AFTER JwtAuthGuard (needs request.user populated).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restriction — JWT validity is sufficient
    }

    const { user } = context.switchToHttp().getRequest<{ user: CurrentUser }>();
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
