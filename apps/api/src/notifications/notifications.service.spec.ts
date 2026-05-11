import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../database/prisma.service';
import { NotificationType } from '@prisma/client';
import type { Notification } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 1,
    employee_id: 10,
    type: NotificationType.TimerForgottenStart,
    read_at: null,
    created_at: new Date('2026-05-03T08:00:00Z'),
    ...overrides,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDeviceToken(overrides: { id?: number; employee_id?: number; token?: string } = {}) {
  return {
    id: overrides.id ?? 1,
    employee_id: overrides.employee_id ?? 10,
    token: overrides.token ?? 'ExpoPushToken[test-token-abc]',
    created_at: new Date('2026-05-11T10:00:00Z'),
    updated_at: new Date('2026-05-11T10:00:00Z'),
  };
}

// ─── Prisma mock ──────────────────────────────────────────────────────────────

const prismaMock = {
  notification: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  deviceToken: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  // ─── findMine ───────────────────────────────────────────────────────────────

  describe('findMine', () => {
    it('returns mapped summaries for the employee', async () => {
      const rows = [makeNotification({ id: 1 }), makeNotification({ id: 2 })];
      prismaMock.notification.findMany.mockResolvedValue(rows);

      const result = await service.findMine(10);

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { employee_id: 10 },
        orderBy: { created_at: 'desc' },
        take: 50,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        type: NotificationType.TimerForgottenStart,
        read_at: null,
        created_at: '2026-05-03T08:00:00.000Z',
      });
    });

    it('returns empty array when no notifications', async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);
      const result = await service.findMine(10);
      expect(result).toEqual([]);
    });
  });

  // ─── markRead ───────────────────────────────────────────────────────────────

  describe('markRead', () => {
    it('sets read_at and returns summary', async () => {
      const original = makeNotification({ id: 5, employee_id: 10 });
      const updated = makeNotification({ id: 5, employee_id: 10, read_at: new Date('2026-05-03T09:00:00Z') });
      prismaMock.notification.findUnique.mockResolvedValue(original);
      prismaMock.notification.update.mockResolvedValue(updated);

      const result = await service.markRead(5, 10);

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: expect.objectContaining({ read_at: expect.any(Date) }),
      });
      expect(result.read_at).toBe('2026-05-03T09:00:00.000Z');
    });

    it('throws NotFoundException when notification does not exist', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(null);
      await expect(service.markRead(99, 10)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when notification belongs to another employee', async () => {
      prismaMock.notification.findUnique.mockResolvedValue(makeNotification({ employee_id: 99 }));
      await expect(service.markRead(1, 10)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  // ─── markAllRead ─────────────────────────────────────────────────────────────

  describe('markAllRead', () => {
    it('calls updateMany for all unread notifications of the employee', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });

      await service.markAllRead(10);

      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: { employee_id: 10, read_at: null },
        data: expect.objectContaining({ read_at: expect.any(Date) }),
      });
    });
  });

  // ─── upsertDeviceToken ───────────────────────────────────────────────────────

  describe('upsertDeviceToken', () => {
    it('calls upsert with correct create/update payload', async () => {
      prismaMock.deviceToken.upsert.mockResolvedValue(makeDeviceToken());

      await service.upsertDeviceToken(10, 'ExpoPushToken[abc]');

      expect(prismaMock.deviceToken.upsert).toHaveBeenCalledWith({
        where: { token: 'ExpoPushToken[abc]' },
        update: { employee_id: 10 },
        create: { employee_id: 10, token: 'ExpoPushToken[abc]' },
      });
    });

    it('re-assigns token to new employee on upsert (device re-login)', async () => {
      prismaMock.deviceToken.upsert.mockResolvedValue(makeDeviceToken({ employee_id: 20 }));

      await service.upsertDeviceToken(20, 'ExpoPushToken[abc]');

      expect(prismaMock.deviceToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { employee_id: 20 } }),
      );
    });
  });

  // ─── removeDeviceToken ───────────────────────────────────────────────────────

  describe('removeDeviceToken', () => {
    it('deletes by token', async () => {
      prismaMock.deviceToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeDeviceToken('ExpoPushToken[abc]');

      expect(prismaMock.deviceToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'ExpoPushToken[abc]' },
      });
    });

    it('does not throw when token not found (idempotent)', async () => {
      prismaMock.deviceToken.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.removeDeviceToken('ExpoPushToken[unknown]')).resolves.toBeUndefined();
    });
  });

  // ─── getTokensForEmployee ────────────────────────────────────────────────────

  describe('getTokensForEmployee', () => {
    it('returns array of token strings for the employee', async () => {
      prismaMock.deviceToken.findMany.mockResolvedValue([
        makeDeviceToken({ token: 'ExpoPushToken[t1]' }),
        makeDeviceToken({ token: 'ExpoPushToken[t2]' }),
      ]);

      const result = await service.getTokensForEmployee(10);

      expect(prismaMock.deviceToken.findMany).toHaveBeenCalledWith({
        where: { employee_id: 10 },
        select: { token: true },
      });
      expect(result).toEqual(['ExpoPushToken[t1]', 'ExpoPushToken[t2]']);
    });

    it('returns empty array when employee has no registered devices', async () => {
      prismaMock.deviceToken.findMany.mockResolvedValue([]);
      const result = await service.getTokensForEmployee(10);
      expect(result).toEqual([]);
    });
  });

  // ─── toSummary ───────────────────────────────────────────────────────────────

  describe('toSummary', () => {
    it('maps unread notification correctly', () => {
      const n = makeNotification();
      const summary = service.toSummary(n);
      expect(summary).toEqual({
        id: 1,
        type: NotificationType.TimerForgottenStart,
        read_at: null,
        created_at: '2026-05-03T08:00:00.000Z',
      });
    });

    it('maps read notification with read_at ISO string', () => {
      const readAt = new Date('2026-05-03T10:00:00Z');
      const n = makeNotification({ read_at: readAt });
      const summary = service.toSummary(n);
      expect(summary.read_at).toBe('2026-05-03T10:00:00.000Z');
    });

    it('maps TimerForgottenStop type correctly', () => {
      const n = makeNotification({ type: NotificationType.TimerForgottenStop });
      expect(service.toSummary(n).type).toBe(NotificationType.TimerForgottenStop);
    });
  });
});
