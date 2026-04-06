import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '@lumicore/shared-types';

/**
 * Extracts the authenticated user from the JWT payload.
 * Usage: @CurrentUser() user: CurrentUser
 */
export const CurrentUserDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUser;
  },
);
