import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { PrismaService } from '../database/prisma.service';
import { TimeTrackingGateway } from './time-tracking.gateway';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<ReturnType<typeof baseEntry>> = {}): ReturnType<typeof baseEntry> {
  return { ...baseEntry(), ...overrides };
}

function baseEntry() {
  return {
    id: 10,
    employee_id: 1,
    project_id: 5 as number | null,
    task_id: null,
    no_project_reason: null,
    started_at: new Date('2026-04-01T08:00:00Z'),
    ended_at: null as Date | null,
    is_manual: false,
    needs_review: false,
    is_confirmed: false,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-01T08:00:00Z'),
    pauses: [] as Array<{
      id: number;
      time_entry_id: number;
      pause_start: Date;
      pause_end: Date | null;
    }>,
    project: { name: 'Test Project' } as { name: string } | null,
    task: null as { name: string } | null,
  };
}

// ─── Mocks ─────────────────────────────────────────────────────────────────

const prismaMock = {
  timeEntry: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  pause: {
    create: jest.fn(),
    update: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const gatewayMock = {
  emitTimerEvent: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('TimeTrackingService', () => {
  let service: TimeTrackingService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeTrackingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TimeTrackingGateway, useValue: gatewayMock },
      ],
    }).compile();

    service = module.get<TimeTrackingService>(TimeTrackingService);
  });

  // ─── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    describe('BR-001: project/reason requirement', () => {
      it('throws BadRequestException when no project_id and no reason', async () => {
        await expect(
          service.create({ project_id: undefined } as any, 1),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException when reason is too short (< 10 chars)', async () => {
        await expect(
          service.create({ no_project_reason: 'too short' } as any, 1),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException when reason is exactly 9 chars', async () => {
        await expect(
          service.create({ no_project_reason: '123456789' } as any, 1),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException when reason is only whitespace', async () => {
        await expect(
          service.create({ no_project_reason: '          ' } as any, 1),
        ).rejects.toThrow(BadRequestException);
      });

      it('accepts a reason with exactly 10 chars', async () => {
        // Stub project validation — no project_id so skip that path
        const entry = makeEntry({ project_id: null });
        prismaMock.timeEntry.create.mockResolvedValue(entry);

        const result = await service.create(
          { no_project_reason: '1234567890' } as any,
          1,
        );
        expect(result).toBeDefined();
      });

      it('accepts a valid project_id without a reason', async () => {
        prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
        const entry = makeEntry();
        prismaMock.timeEntry.create.mockResolvedValue(entry);

        const result = await service.create({ project_id: 5 } as any, 1);
        expect(result).toBeDefined();
      });
    });

    describe('BR-002: manual entry zero-duration guard', () => {
      it('throws BadRequestException when started_at === ended_at', async () => {
        const ts = '2026-04-01T10:00:00Z';
        await expect(
          service.create(
            { project_id: 5, is_manual: true, started_at: ts, ended_at: ts } as any,
            1,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException when started_at > ended_at', async () => {
        await expect(
          service.create(
            {
              project_id: 5,
              is_manual: true,
              started_at: '2026-04-01T11:00:00Z',
              ended_at: '2026-04-01T10:00:00Z',
            } as any,
            1,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('throws BadRequestException when manual entry is missing ended_at', async () => {
        prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
        await expect(
          service.create(
            { project_id: 5, is_manual: true, started_at: '2026-04-01T10:00:00Z' } as any,
            1,
          ),
        ).rejects.toThrow(BadRequestException);
      });

      it('creates entry for valid manual entry with positive duration', async () => {
        prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
        const entry = makeEntry({
          started_at: new Date('2026-04-01T10:00:00Z'),
          ended_at: new Date('2026-04-01T11:00:00Z'),
          is_manual: true,
        });
        prismaMock.timeEntry.create.mockResolvedValue(entry);

        const result = await service.create(
          {
            project_id: 5,
            is_manual: true,
            started_at: '2026-04-01T10:00:00Z',
            ended_at: '2026-04-01T11:00:00Z',
          } as any,
          1,
        );
        expect(result).toBeDefined();
        // BR-003: duration_seconds must be computed, not from stored field
        expect(result.duration_seconds).toBe(3600);
      });
    });

    describe('BR-003: duration never stored, always computed', () => {
      it('ignores any duration field in the DTO and computes from timestamps', async () => {
        prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
        const entry = makeEntry({
          started_at: new Date('2026-04-01T08:00:00Z'),
          ended_at: new Date('2026-04-01T10:00:00Z'),
          is_manual: true,
        });
        prismaMock.timeEntry.create.mockResolvedValue(entry);

        const result = await service.create(
          {
            project_id: 5,
            is_manual: true,
            started_at: '2026-04-01T08:00:00Z',
            ended_at: '2026-04-01T10:00:00Z',
            duration_seconds: 999999, // should be ignored
          } as any,
          1,
        );
        // Computed: 2 hours = 7200s (not 999999)
        expect(result.duration_seconds).toBe(7200);
      });
    });

    it('emits timer:started WebSocket event for timer-start (non-manual) entries', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
      const entry = makeEntry();
      prismaMock.timeEntry.create.mockResolvedValue(entry);

      await service.create({ project_id: 5 } as any, 1);

      expect(gatewayMock.emitTimerEvent).toHaveBeenCalledWith(
        'timer:started',
        expect.objectContaining({ employee_id: 1 }),
      );
    });

    it('throws BadRequestException when project_id references archived project', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: new Date() });

      await expect(service.create({ project_id: 5 } as any, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when project_id does not exist', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(service.create({ project_id: 999 } as any, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── pause() ──────────────────────────────────────────────────────────────

  describe('pause()', () => {
    it('throws NotFoundException when entry does not exist', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(null);
      await expect(service.pause(99, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when entry belongs to a different employee', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(makeEntry({ employee_id: 2 }));
      await expect(service.pause(10, 1)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when entry is already stopped', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(
        makeEntry({ ended_at: new Date() }),
      );
      await expect(service.pause(10, 1)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when entry is already paused', async () => {
      const entry = makeEntry({
        pauses: [
          { id: 1, time_entry_id: 10, pause_start: new Date(), pause_end: null },
        ],
      });
      prismaMock.timeEntry.findUnique.mockResolvedValue(entry);
      await expect(service.pause(10, 1)).rejects.toThrow(BadRequestException);
    });

    it('creates a pause record and emits timer:paused', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(makeEntry());
      const updatedEntry = makeEntry({
        pauses: [
          { id: 1, time_entry_id: 10, pause_start: new Date(), pause_end: null },
        ],
      });
      prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock),
      );
      prismaMock.pause.create.mockResolvedValue({});
      prismaMock.timeEntry.findUniqueOrThrow.mockResolvedValue(updatedEntry);

      await service.pause(10, 1);

      expect(prismaMock.pause.create).toHaveBeenCalled();
      expect(gatewayMock.emitTimerEvent).toHaveBeenCalledWith(
        'timer:paused',
        expect.objectContaining({ employee_id: 1, time_entry_id: 10 }),
      );
    });
  });

  // ─── resume() ─────────────────────────────────────────────────────────────

  describe('resume()', () => {
    it('throws NotFoundException when entry does not exist', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(null);
      await expect(service.resume(99, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when entry belongs to a different employee', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(makeEntry({ employee_id: 2 }));
      await expect(service.resume(10, 1)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when entry is not currently paused', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(makeEntry({ pauses: [] }));
      await expect(service.resume(10, 1)).rejects.toThrow(BadRequestException);
    });

    it('closes the open pause and emits timer:resumed', async () => {
      const openPause = { id: 1, time_entry_id: 10, pause_start: new Date(), pause_end: null };
      prismaMock.timeEntry.findUnique.mockResolvedValue(makeEntry({ pauses: [openPause] }));
      const updatedEntry = makeEntry({ pauses: [] });
      prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock),
      );
      prismaMock.pause.update.mockResolvedValue({});
      prismaMock.timeEntry.findUniqueOrThrow.mockResolvedValue(updatedEntry);

      await service.resume(10, 1);

      expect(prismaMock.pause.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(gatewayMock.emitTimerEvent).toHaveBeenCalledWith(
        'timer:resumed',
        expect.objectContaining({ employee_id: 1, time_entry_id: 10 }),
      );
    });
  });

  // ─── stop() ───────────────────────────────────────────────────────────────

  describe('stop()', () => {
    it('throws NotFoundException when entry does not exist', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(null);
      await expect(service.stop(99, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when entry belongs to a different employee', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(makeEntry({ employee_id: 2 }));
      await expect(service.stop(10, 1)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when entry is already stopped', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(
        makeEntry({ ended_at: new Date() }),
      );
      await expect(service.stop(10, 1)).rejects.toThrow(BadRequestException);
    });

    it('sets ended_at and emits timer:stopped', async () => {
      prismaMock.timeEntry.findUnique.mockResolvedValue(makeEntry());
      const stoppedEntry = makeEntry({ ended_at: new Date() });
      prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock),
      );
      prismaMock.timeEntry.update.mockResolvedValue({});
      prismaMock.timeEntry.findUniqueOrThrow.mockResolvedValue(stoppedEntry);

      await service.stop(10, 1);

      expect(prismaMock.timeEntry.update).toHaveBeenCalled();
      expect(gatewayMock.emitTimerEvent).toHaveBeenCalledWith(
        'timer:stopped',
        expect.objectContaining({ employee_id: 1, time_entry_id: 10 }),
      );
    });

    it('BR-002: throws BadRequestException when computed duration is zero (immediate stop)', async () => {
      const now = new Date();
      // started_at === now → duration after pause close would be 0
      const entry = makeEntry({
        started_at: now,
        pauses: [{ id: 1, time_entry_id: 10, pause_start: now, pause_end: null }],
      });
      prismaMock.timeEntry.findUnique.mockResolvedValue(entry);
      prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
        fn(prismaMock),
      );
      prismaMock.pause.update.mockResolvedValue({});

      await expect(service.stop(10, 1)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Duration computation (BR-003) ────────────────────────────────────────

  describe('duration computation', () => {
    it('computes duration_seconds correctly without pauses', async () => {
      const entry = makeEntry({
        started_at: new Date('2026-04-01T08:00:00Z'),
        ended_at: new Date('2026-04-01T10:30:00Z'),
        pauses: [],
      });
      prismaMock.timeEntry.findUnique.mockResolvedValue(entry);
      prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
      prismaMock.timeEntry.create.mockResolvedValue(entry);

      // We test via toDetail mapper — use create() with manual entry as a proxy
      const result = await service.create(
        {
          project_id: 5,
          is_manual: true,
          started_at: '2026-04-01T08:00:00Z',
          ended_at: '2026-04-01T10:30:00Z',
        } as any,
        1,
      );

      // 2.5 hours = 9000 seconds
      expect(result.duration_seconds).toBe(9000);
    });

    it('subtracts closed pause time from duration', async () => {
      // 2-hour entry with a 30-min pause → net 1.5h = 5400s
      const entry = makeEntry({
        started_at: new Date('2026-04-01T08:00:00Z'),
        ended_at: new Date('2026-04-01T10:00:00Z'),
        pauses: [
          {
            id: 1,
            time_entry_id: 10,
            pause_start: new Date('2026-04-01T09:00:00Z'),
            pause_end: new Date('2026-04-01T09:30:00Z'),
          },
        ],
      });
      prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
      prismaMock.timeEntry.create.mockResolvedValue(entry);

      const result = await service.create(
        {
          project_id: 5,
          is_manual: true,
          started_at: '2026-04-01T08:00:00Z',
          ended_at: '2026-04-01T10:00:00Z',
        } as any,
        1,
      );

      // net = 7200 - 1800 = 5400
      expect(result.duration_seconds).toBe(5400);
    });

    it('returns duration_seconds null for open (running) entry', async () => {
      const openEntry = makeEntry({ ended_at: null, pauses: [] });
      prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
      prismaMock.timeEntry.create.mockResolvedValue(openEntry);

      const result = await service.create({ project_id: 5 } as any, 1);
      expect(result.duration_seconds).toBeNull();
    });

    it('subtracts multiple closed pauses correctly', async () => {
      // 3-hour entry with two 20-min pauses → net 3h - 40m = 2h20m = 8400s
      const entry = makeEntry({
        started_at: new Date('2026-04-01T07:00:00Z'),
        ended_at: new Date('2026-04-01T10:00:00Z'),
        pauses: [
          {
            id: 1,
            time_entry_id: 10,
            pause_start: new Date('2026-04-01T08:00:00Z'),
            pause_end: new Date('2026-04-01T08:20:00Z'),
          },
          {
            id: 2,
            time_entry_id: 10,
            pause_start: new Date('2026-04-01T09:00:00Z'),
            pause_end: new Date('2026-04-01T09:20:00Z'),
          },
        ],
      });
      prismaMock.project.findUnique.mockResolvedValue({ id: 5, archived_at: null });
      prismaMock.timeEntry.create.mockResolvedValue(entry);

      const result = await service.create(
        {
          project_id: 5,
          is_manual: true,
          started_at: '2026-04-01T07:00:00Z',
          ended_at: '2026-04-01T10:00:00Z',
        } as any,
        1,
      );

      // 10800 - 1200 - 1200 = 8400
      expect(result.duration_seconds).toBe(8400);
    });
  });
});
