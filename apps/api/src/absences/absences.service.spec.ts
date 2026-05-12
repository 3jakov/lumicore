import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AbsencesService } from './absences.service';
import { PrismaService } from '../database/prisma.service';
import { AbsenceType } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAbsence(overrides: Partial<ReturnType<typeof baseAbsence>> = {}) {
  return { ...baseAbsence(), ...overrides };
}

function baseAbsence(): {
  id: number; employee_id: number; type: AbsenceType;
  date_from: Date; date_to: Date; comment: string | null;
  created_by_id: number; created_at: Date; updated_at: Date;
  employee: { full_name: string };
} {
  return {
    id: 1,
    employee_id: 10,
    type: AbsenceType.SvobodnyiDen,
    date_from: new Date('2026-05-05'),
    date_to: new Date('2026-05-05'),
    comment: null as string | null,
    created_by_id: 99,
    created_at: new Date('2026-05-03T00:00:00Z'),
    updated_at: new Date('2026-05-03T00:00:00Z'),
    employee: { full_name: 'Jaan Tamm' },
  };
}

// ─── Prisma mock ──────────────────────────────────────────────────────────────

const prismaMock = {
  absence: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AbsencesService', () => {
  let service: AbsencesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbsencesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get<AbsencesService>(AbsencesService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates an absence and returns summary', async () => {
      const row = makeAbsence();
      prismaMock.absence.create.mockResolvedValue(row);

      const result = await service.create(
        { employee_id: 10, type: AbsenceType.SvobodnyiDen, date_from: '2026-05-05', date_to: '2026-05-05' },
        99,
      );

      expect(result.code).toBe('СД');
      expect(result.reduces_norm_hours).toBe(true);
      expect(result.date_from).toBe('2026-05-05');
      expect(prismaMock.absence.create).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException when date_to < date_from', async () => {
      await expect(
        service.create(
          { employee_id: 10, type: AbsenceType.SvobodnyiDen, date_from: '2026-05-10', date_to: '2026-05-05' },
          99,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('uses range-overlap filter when date_from and date_to provided', async () => {
      prismaMock.absence.findMany.mockResolvedValue([]);

      await service.findAll({ date_from: '2026-05-01', date_to: '2026-05-31' });

      const where = prismaMock.absence.findMany.mock.calls[0][0].where;
      // Must find absences whose date_from <= 2026-05-31 AND date_to >= 2026-05-01
      expect(where.date_from).toEqual({ lte: new Date('2026-05-31') });
      expect(where.date_to).toEqual({ gte: new Date('2026-05-01') });
    });

    it('filters by employee_id when provided', async () => {
      prismaMock.absence.findMany.mockResolvedValue([]);

      await service.findAll({ employee_id: 10 });

      const where = prismaMock.absence.findMany.mock.calls[0][0].where;
      expect(where.employee_id).toBe(10);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes existing absence', async () => {
      prismaMock.absence.findUnique.mockResolvedValue(makeAbsence());
      prismaMock.absence.delete.mockResolvedValue(undefined);

      await service.remove(1);

      expect(prismaMock.absence.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws NotFoundException for unknown id', async () => {
      prismaMock.absence.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── ABSENCE_META correctness ─────────────────────────────────────────────

  describe('ABSENCE_META codes', () => {
    it('Komandirovka does NOT reduce norm', async () => {
      const row = makeAbsence({ type: AbsenceType.Komandirovka });
      prismaMock.absence.create.mockResolvedValue(row);

      const result = await service.create(
        { employee_id: 10, type: AbsenceType.Komandirovka, date_from: '2026-05-05', date_to: '2026-05-05' },
        99,
      );

      expect(result.code).toBe('К');
      expect(result.reduces_norm_hours).toBe(false);
    });

    it('Bolnichnyi reduces norm', async () => {
      const row = makeAbsence({ type: AbsenceType.Bolnichnyi });
      prismaMock.absence.create.mockResolvedValue(row);

      const result = await service.create(
        { employee_id: 10, type: AbsenceType.Bolnichnyi, date_from: '2026-05-05', date_to: '2026-05-05' },
        99,
      );

      expect(result.code).toBe('Б');
      expect(result.reduces_norm_hours).toBe(true);
    });
  });
});
