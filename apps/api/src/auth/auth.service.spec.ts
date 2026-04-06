import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

// ─── Prisma mock ──────────────────────────────────────────────────────────────

const mockEmployee = {
  id: 1,
  full_name: 'Test User',
  initials: 'TU',
  photo_url: null,
  avatar_color: '#4F46E5',
  language: 'et',
  time_format: 'H24',
  group: 'Kontor',
  archived_at: null,
  password_hash: null as string | null,
  roles: [{ role: { name: 'Administraator' } }],
};

const prismaMock = {
  employee: {
    findUnique: jest.fn(),
  },
  otpCode: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const jwtMock = {
  sign: jest.fn().mockReturnValue('signed.jwt.token'),
};

const configMock = {
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
  get: jest.fn().mockReturnValue('15m'),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws UnauthorizedException if employee not found', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      await expect(service.login('x@x.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if employee is archived', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({
        ...mockEmployee,
        archived_at: new Date(),
      });

      await expect(service.login('x@x.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if no password_hash set', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({
        ...mockEmployee,
        password_hash: null,
      });

      await expect(service.login('x@x.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if password does not match', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      prismaMock.employee.findUnique.mockResolvedValue({
        ...mockEmployee,
        password_hash: hash,
      });

      await expect(service.login('x@x.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns AuthResponse on valid credentials', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      prismaMock.employee.findUnique.mockResolvedValue({
        ...mockEmployee,
        password_hash: hash,
      });
      prismaMock.refreshToken.create.mockResolvedValue({ id: 1 });

      const result = await service.login('x@x.com', 'correct-password');

      expect(result).toMatchObject({
        access_token: 'signed.jwt.token',
        user: expect.objectContaining({ id: 1, full_name: 'Test User' }),
      });
      expect(result.refresh_token).toBeDefined();
    });
  });

  // ─── OTP verify ────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('throws UnauthorizedException if no valid OTP record found', async () => {
      prismaMock.otpCode.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp('+37255000000', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if OTP code does not match', async () => {
      const codeHash = await bcrypt.hash('654321', 10);
      prismaMock.otpCode.findFirst.mockResolvedValue({
        id: 1,
        employee_id: 1,
        code_hash: codeHash,
      });

      await expect(service.verifyOtp('+37255000000', '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns AuthResponse on valid OTP', async () => {
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 10);
      prismaMock.otpCode.findFirst.mockResolvedValue({
        id: 1,
        employee_id: 1,
        code_hash: codeHash,
      });
      prismaMock.otpCode.update.mockResolvedValue({});
      prismaMock.employee.findUnique.mockResolvedValue(mockEmployee);
      prismaMock.refreshToken.create.mockResolvedValue({ id: 1 });

      const result = await service.verifyOtp('+37255000000', code);

      expect(result.access_token).toBe('signed.jwt.token');
      expect(result.user.id).toBe(1);
    });
  });

  // ─── refreshTokens ─────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('throws UnauthorizedException if token not found', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if token is revoked', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        revoked_at: new Date(),
        expires_at: new Date(Date.now() + 100000),
        employee: mockEmployee,
      });

      await expect(service.refreshTokens('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if token is expired', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        revoked_at: null,
        expires_at: new Date(Date.now() - 1000), // past
        employee: mockEmployee,
      });

      await expect(service.refreshTokens('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rotates tokens and returns new AuthResponse on valid token', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        revoked_at: null,
        expires_at: new Date(Date.now() + 86400000),
        employee: mockEmployee,
      });
      prismaMock.refreshToken.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({ id: 2 });

      const result = await service.refreshTokens('valid-token');

      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revoked_at: expect.any(Date) } }),
      );
      expect(result.access_token).toBe('signed.jwt.token');
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('does nothing if no token provided', async () => {
      await service.logout(undefined);
      expect(prismaMock.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('revokes the refresh token', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('some-token');

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revoked_at: expect.any(Date) } }),
      );
    });
  });

  // ─── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns CurrentUser for a valid employee id', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await service.getMe(1);

      expect(result).toMatchObject({
        id: 1,
        full_name: 'Test User',
        roles: ['Administraator'],
      });
    });

    it('throws NotFoundException for unknown id', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      await expect(service.getMe(999)).rejects.toThrow(NotFoundException);
    });
  });
});
