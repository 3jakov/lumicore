import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Validates the Bearer JWT from the Authorization header.
 * Attaches the decoded CurrentUser payload to request.user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
