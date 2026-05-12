import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../database/prisma.service';
import { EmployeeGroup, Language, TimeFormat } from '@lumicore/shared-types';
import type { CurrentUser } from '@lumicore/shared-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEmployee(overrides: Partial<ReturnType<typeof baseEmployee>> = {}) {
  return { ...baseEmployee(), ...overrides };
}

function baseEmployee() {
  return {
    id: 1,
    full_name: 'Jaan Tamm',
    initials: 'JT',
    photo_url: null as string | null,
    avatar_color: '#4F46E5',
    group: EmployeeGroup.Kontor as string,
    status: 'Aktiivne' as string,
    phone: null as string | null,
    email: null as string | null,
    language: Language.ET as string,
    time_format: TimeFormat.H24 as string,
    work_schedule: null as string | null,
    norm_hours_per_week: 40,
    project_access_all: true,
    additional_info: null as string | null,
    hourly_rate: null as { toString(): string } | null,
    personal_id: null as string | null,
    birth_date: null as Date | null,
    password_hash: null as string | null,
    archived_at: null as Date | null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    roles: [] as Array<{ role: { name: string } }>,
  };
}

function adminUser(): CurrentUser {
  return {
    id: 99,
    full_name: 'Admin',
    initials: 'A',
    photo_url: null,
    avatar_color: '#4F46E5',
    language: Language.ET,
    time_format: TimeFormat.H24,
    roles: ['Administraator'],
    group: EmployeeGroup.Kontor,
  };
}

function regularUser(): CurrentUser {
  return { ...adminUser(), id: 5, roles: ['Töötaja'] };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  employee: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  role: {
    findMany: jest.fn(),
  },
  employeeRole: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  // ─── findOne() — BR-013 sensitive field access ────────────────────────────

  describe('findOne() — BR-013: sensitive fields', () => {
    const sensitiveEmployee = makeEmployee({
      hourly_rate: { toString: () => '25.50' },
      personal_id: '38001011234',
      birth_date: new Date('1980-01-01'),
    });

    it('includes hourly_rate, personal_id, birth_date for admin users', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sensitiveEmployee);

      const result = await service.findOne(1, adminUser());

      expect(result.hourly_rate).toBe('25.50');
      expect(result.personal_id).toBe('38001011234');
      expect(result.birth_date).toBe('1980-01-01');
    });

    it('omits hourly_rate for non-admin users', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sensitiveEmployee);

      const result = await service.findOne(1, regularUser());

      expect(result.hourly_rate).toBeUndefined();
    });

    it('omits personal_id for non-admin users', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sensitiveEmployee);

      const result = await service.findOne(1, regularUser());

      expect(result.personal_id).toBeUndefined();
    });

    it('omits birth_date for non-admin users', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sensitiveEmployee);

      const result = await service.findOne(1, regularUser());

      expect(result.birth_date).toBeUndefined();
    });

    it('still returns non-sensitive fields for non-admin users', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(sensitiveEmployee);

      const result = await service.findOne(1, regularUser());

      expect(result.full_name).toBe('Jaan Tamm');
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
    });

    it('throws NotFoundException when employee does not exist', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999, adminUser())).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when employee is archived', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(
        makeEmployee({ archived_at: new Date() }),
      );

      await expect(service.findOne(1, adminUser())).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates an employee with minimal fields', async () => {
      prismaMock.employee.findFirst.mockResolvedValue(null); // no phone/email conflict
      const emp = makeEmployee();
      prismaMock.$transaction.mockImplementation(
        async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
      );
      prismaMock.employee.create.mockResolvedValue(emp);
      prismaMock.employee.findUniqueOrThrow.mockResolvedValue(emp);

      const result = await service.create({
        full_name: 'Jaan Tamm',
        group: EmployeeGroup.Kontor,
      });

      expect(result.full_name).toBe('Jaan Tamm');
    });

    it('throws ConflictException when phone is already in use', async () => {
      // findFirst returns a match → phone conflict
      prismaMock.employee.findFirst.mockResolvedValue({ id: 2 });

      await expect(
        service.create({
          full_name: 'Mari Mets',
          group: EmployeeGroup.Kontor,
          phone: '+37255512345',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when email is already in use', async () => {
      // No phone in this call → assertContactUniqueness only checks email (one findFirst call)
      prismaMock.employee.findFirst.mockResolvedValueOnce({ id: 3 });

      await expect(
        service.create({
          full_name: 'Mari Mets',
          group: EmployeeGroup.Kontor,
          email: 'existing@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when a role_id does not exist', async () => {
      prismaMock.employee.findFirst.mockResolvedValue(null);
      // Only role 1 exists, role 99 does not
      prismaMock.role.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.create({
          full_name: 'Test User',
          group: EmployeeGroup.Kontor,
          role_ids: [1, 99],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes initials correctly from full name', async () => {
      prismaMock.employee.findFirst.mockResolvedValue(null);
      const emp = makeEmployee({ full_name: 'Jaan Tamm', initials: 'JT' });
      prismaMock.$transaction.mockImplementation(
        async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
      );
      prismaMock.employee.create.mockResolvedValue(emp);
      prismaMock.employee.findUniqueOrThrow.mockResolvedValue(emp);

      await service.create({ full_name: 'Jaan Tamm', group: EmployeeGroup.Kontor });

      expect(prismaMock.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ initials: 'JT' }),
        }),
      );
    });

    it('computes single-word initials correctly', async () => {
      prismaMock.employee.findFirst.mockResolvedValue(null);
      const emp = makeEmployee({ full_name: 'Admin', initials: 'A' });
      prismaMock.$transaction.mockImplementation(
        async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
      );
      prismaMock.employee.create.mockResolvedValue(emp);
      prismaMock.employee.findUniqueOrThrow.mockResolvedValue(emp);

      await service.create({ full_name: 'Admin', group: EmployeeGroup.Kontor });

      expect(prismaMock.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ initials: 'A' }),
        }),
      );
    });
  });

  // ─── archive() ────────────────────────────────────────────────────────────

  describe('archive()', () => {
    it('sets archived_at on the employee (soft delete)', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(makeEmployee());
      prismaMock.employee.update.mockResolvedValue({});

      const result = await service.archive(1);

      expect(result).toEqual({ id: 1 });
      expect(prismaMock.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ archived_at: expect.any(Date) }),
        }),
      );
    });

    it('throws NotFoundException when employee does not exist', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      await expect(service.archive(999)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when employee is already archived', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(
        makeEmployee({ archived_at: new Date() }),
      );

      await expect(service.archive(1)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── adminUpdate() ────────────────────────────────────────────────────────

  describe('adminUpdate()', () => {
    it('updates employee fields', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(makeEmployee());
      prismaMock.employee.findFirst.mockResolvedValue(null);
      const updated = makeEmployee({ full_name: 'Updated Name', initials: 'UN' });
      prismaMock.$transaction.mockImplementation(
        async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
      );
      prismaMock.employee.update.mockResolvedValue(updated);
      prismaMock.employee.findUniqueOrThrow.mockResolvedValue(updated);

      const result = await service.adminUpdate(1, { full_name: 'Updated Name' });

      expect(result.full_name).toBe('Updated Name');
    });

    it('recomputes initials when full_name is updated', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(makeEmployee());
      prismaMock.employee.findFirst.mockResolvedValue(null);
      const updated = makeEmployee({ full_name: 'Peeter Kask', initials: 'PK' });
      prismaMock.$transaction.mockImplementation(
        async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
      );
      prismaMock.employee.update.mockResolvedValue(updated);
      prismaMock.employee.findUniqueOrThrow.mockResolvedValue(updated);

      await service.adminUpdate(1, { full_name: 'Peeter Kask' });

      expect(prismaMock.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ initials: 'PK' }),
        }),
      );
    });

    it('throws ConflictException when updating to a phone number already in use', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(
        makeEmployee({ phone: '+37255511111' }),
      );
      // New phone is different → conflict check triggers → finds existing
      prismaMock.employee.findFirst.mockResolvedValue({ id: 7 });

      await expect(
        service.adminUpdate(1, { phone: '+37255599999' }),
      ).rejects.toThrow(ConflictException);
    });

    it('does not trigger phone conflict check when phone is unchanged', async () => {
      const existing = makeEmployee({ phone: '+37255511111' });
      prismaMock.employee.findUnique.mockResolvedValue(existing);
      const updated = makeEmployee({ phone: '+37255511111' });
      prismaMock.$transaction.mockImplementation(
        async (fn: (tx: typeof prismaMock) => Promise<unknown>) => fn(prismaMock),
      );
      prismaMock.employee.update.mockResolvedValue(updated);
      prismaMock.employee.findUniqueOrThrow.mockResolvedValue(updated);

      // Phone is the same as existing → no conflict check → findFirst never called
      await service.adminUpdate(1, { phone: '+37255511111' });

      expect(prismaMock.employee.findFirst).not.toHaveBeenCalled();
    });
  });
});
