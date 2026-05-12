import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt } from 'crypto';
import { addMinutes, addDays } from 'date-fns';
import { PrismaService } from '../database/prisma.service';
import { CurrentUser, AuthResponse } from '@lumicore/shared-types';
import { Employee } from '@prisma/client';

type EmployeeWithRoles = Employee & {
  roles: Array<{ role: { name: string } }>;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Email + Password Login ──────────────────────────────────────────────

  async login(email: string, password: string): Promise<AuthResponse> {
    const employee = await this.findEmployeeByEmail(email);

    if (!employee.password_hash) {
      throw new UnauthorizedException('Password login not configured for this account');
    }

    const passwordValid = await bcrypt.compare(password, employee.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueAuthResponse(employee);
  }

  // ─── OTP Flow ────────────────────────────────────────────────────────────

  async requestOtp(phone: string): Promise<{ message: string }> {
    // Employee must exist with this phone number
    const employee = await this.prisma.employee.findUnique({
      where: { phone },
    });

    if (!employee) {
      // Return success-like response to prevent phone enumeration
      this.logger.log(`OTP requested for unknown phone: ${phone}`);
      return { message: 'If the number is registered, a code has been sent' };
    }

    // Generate cryptographically secure 6-digit OTP
    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = addMinutes(new Date(), 10);

    // Invalidate existing unused codes for this phone
    await this.prisma.otpCode.updateMany({
      where: { phone, used_at: null },
      data: { used_at: new Date() }, // mark as used (expired)
    });

    await this.prisma.otpCode.create({
      data: {
        employee_id: employee.id,
        phone,
        code_hash: codeHash,
        expires_at: expiresAt,
      },
    });

    // TODO: Send SMS via SMS provider when SMS_PROVIDER_API_KEY is configured
    // For now, log in dev environment
    this.logger.log(`[DEV] OTP for ${phone}: ${code}`);

    return { message: 'If the number is registered, a code has been sent' };
  }

  async verifyOtp(phone: string, code: string): Promise<AuthResponse> {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        used_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    const codeValid = await bcrypt.compare(code, otpRecord.code_hash);
    if (!codeValid) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used_at: new Date() },
    });

    if (!otpRecord.employee_id) {
      throw new UnauthorizedException('OTP not linked to an employee');
    }

    const employee = await this.findEmployeeById(otpRecord.employee_id);
    return this.issueAuthResponse(employee);
  }

  // ─── Refresh Tokens ──────────────────────────────────────────────────────

  async refreshTokens(incomingToken: string): Promise<AuthResponse> {
    // Find the stored refresh token record
    const tokenHash = this.hashToken(incomingToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { employee: { include: { roles: { include: { role: true } } } } },
    });

    if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Rotate: revoke old token, issue new pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked_at: new Date() },
    });

    return this.issueAuthResponse(stored.employee as EmployeeWithRoles);
  }

  /**
   * Returns a fresh CurrentUser from DB — used by GET /auth/me.
   * Ensures roles/language reflect DB state even if JWT was issued before a change.
   */
  async getMe(employeeId: number): Promise<CurrentUser> {
    const employee = await this.findEmployeeById(employeeId);
    return this.buildCurrentUser(employee);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async issueAuthResponse(employee: EmployeeWithRoles): Promise<AuthResponse> {
    const user = this.buildCurrentUser(employee);
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(employee.id);

    return { access_token: accessToken, refresh_token: refreshToken, user };
  }

  private buildCurrentUser(employee: EmployeeWithRoles): CurrentUser {
    return {
      id: employee.id,
      full_name: employee.full_name,
      initials: employee.initials,
      photo_url: employee.photo_url,
      avatar_color: employee.avatar_color,
      language: employee.language as CurrentUser['language'],
      time_format: employee.time_format as CurrentUser['time_format'],
      roles: employee.roles.map((r) => r.role.name),
      group: employee.group,
    };
  }

  private signAccessToken(user: CurrentUser): string {
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    return this.jwt.sign(
      { ...user, sub: user.id },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        // Cast required: @nestjs/jwt types expiresIn as ms.StringValue | number
        expiresIn: expiresIn as unknown as number,
      },
    );
  }

  private async createRefreshToken(employeeId: number): Promise<string> {
    // Generate a cryptographically random 64-byte token
    const token = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = addDays(new Date(), 7);

    await this.prisma.refreshToken.create({
      data: {
        employee_id: employeeId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return token;
  }

  /**
   * SHA-256 of the raw token — deterministic, safe for DB lookup.
   * bcrypt is NOT used here because it is non-deterministic (random salt).
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async findEmployeeByEmail(email: string): Promise<EmployeeWithRoles> {
    const employee = await this.prisma.employee.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });

    if (!employee || employee.archived_at) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return employee;
  }

  private async findEmployeeById(id: number): Promise<EmployeeWithRoles> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });

    if (!employee || employee.archived_at) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }
}
