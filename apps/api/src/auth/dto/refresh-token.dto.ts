import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  /**
   * Omit for web clients — they send the httpOnly cookie automatically.
   * Native clients (iOS/Android) must include this in the request body.
   */
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
