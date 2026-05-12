import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse, CurrentUser } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Email + Password Login ──────────────────────────────────────────────

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto.email, dto.password);
    this.setRefreshCookie(res, result.refresh_token);
    return result;
  }

  // ─── OTP Flow ────────────────────────────────────────────────────────────

  @Post('otp/request')
  @HttpCode(200)
  async otpRequest(@Body() dto: OtpRequestDto): Promise<{ message: string }> {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(200)
  async otpVerify(
    @Body() dto: OtpVerifyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.verifyOtp(dto.phone, dto.code);
    this.setRefreshCookie(res, result.refresh_token);
    return result;
  }

  // ─── Session Bootstrap ────────────────────────────────────────────────────

  /**
   * GET /api/v1/auth/me
   *
   * Returns the current user from the validated JWT.
   * Used by the frontend on page load / app boot to hydrate session state
   * without storing sensitive user data in localStorage.
   *
   * Returns fresh data from DB so the client always gets up-to-date
   * roles/language even if the JWT is slightly stale (within its 15m window).
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUserDecorator() user: CurrentUser): Promise<CurrentUser> {
    // Fetch fresh from DB — ensures roles/language are current, not stale from JWT
    return this.authService.getMe(user.id);
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────

  /**
   * Dual-mode:
   *  - Web clients: send no body — token is read from httpOnly cookie
   *  - Native clients: send { refresh_token } in request body
   */
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const incomingToken =
      (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ?? body.refresh_token;

    if (!incomingToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refreshTokens(incomingToken);
    this.setRefreshCookie(res, result.refresh_token);
    return result;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const token =
      (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ?? body.refresh_token;

    await this.authService.logout(token);
    res.clearCookie(REFRESH_COOKIE);
    return { message: 'Logged out successfully' };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, COOKIE_OPTIONS);
  }
}
