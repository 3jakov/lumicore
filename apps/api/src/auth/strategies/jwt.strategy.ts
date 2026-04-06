import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '@lumicore/shared-types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Called after signature + expiry are validated by passport-jwt.
   * The returned value is attached to request.user.
   */
  validate(payload: CurrentUser & { sub: number; iat: number; exp: number }): CurrentUser {
    if (!payload?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }
    // Return the CurrentUser shape (strip JWT-internal fields)
    return {
      id: payload.id,
      full_name: payload.full_name,
      initials: payload.initials,
      photo_url: payload.photo_url,
      avatar_color: payload.avatar_color,
      language: payload.language,
      time_format: payload.time_format,
      roles: payload.roles,
      group: payload.group,
    };
  }
}
