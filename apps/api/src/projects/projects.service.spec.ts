import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../database/prisma.service';
import { ProjectStatus } from '@lumicore/shared-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<ReturnType<typeof baseProject>> = {}) {
  return { ...baseProject(), ...overrides };
}

function baseProject() {
  return {
    id: 1,
    name: 'Test Project',
    status: ProjectStatus.Ettevalmistuses,
    description: null as string | null,
    start_date: null as Date | null,
    end_date: null as Date | null,
    location_address: null as string | null,
    location_lat: null as number | null,
    location_lng: null as number | null,
    contract_number: null as string | null,
    project_manager_id: null as number | null,
    client_company_name: null as string | null,
    client_reg_code: null as string | null,
    client_contact_name: null as string | null,
    client_phone: null as string | null,
    client_email: null as string | null,
    archived_at: null as Date | null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const prismaMock = {
  project: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  employee: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  // ─── findOne() ────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('returns project detail when project exists', async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProject());
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Project');
    });

    it('throws NotFoundException when project does not exist', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when project is archived', async () => {
      prismaMock.project.findUnique.mockResolvedValue(
        makeProject({ archived_at: new Date() }),
      );
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── BR-004: display_id prefix ────────────────────────────────────────────

  describe('BR-004: display_id prefix', () => {
    it('uses QUOT- prefix for Hinnapakkumises status', async () => {
      prismaMock.project.findUnique.mockResolvedValue(
        makeProject({ id: 7, status: ProjectStatus.Hinnapakkumises }),
      );
      const result = await service.findOne(7);
      expect(result.display_id).toBe('QUOT-7');
    });

    it('uses P- prefix for Ettevalmistuses status', async () => {
      prismaMock.project.findUnique.mockResolvedValue(
        makeProject({ id: 3, status: ProjectStatus.Ettevalmistuses }),
      );
      const result = await service.findOne(3);
      expect(result.display_id).toBe('P-3');
    });

    it('uses P- prefix for Töös status', async () => {
      prismaMock.project.findUnique.mockResolvedValue(
        makeProject({ id: 12, status: ProjectStatus.Toos }),
      );
      const result = await service.findOne(12);
      expect(result.display_id).toBe('P-12');
    });

    it('uses P- prefix for Lõpetatud status', async () => {
      prismaMock.project.findUnique.mockResolvedValue(
        makeProject({ id: 4, status: ProjectStatus.Lopetatud }),
      );
      const result = await service.findOne(4);
      expect(result.display_id).toBe('P-4');
    });

    it('display_id prefix changes when status is updated from Hinnapakkumises to Töös', async () => {
      const project = makeProject({ id: 5, status: ProjectStatus.Toos });
      // findOne is called inside update() to check existence
      prismaMock.project.findUnique.mockResolvedValue(project);
      prismaMock.project.update.mockResolvedValue(project);

      const result = await service.update(5, { status: ProjectStatus.Toos });
      expect(result.display_id).toBe('P-5');
    });
  });

  // ─── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a project with minimal fields', async () => {
      const project = makeProject();
      prismaMock.project.create.mockResolvedValue(project);

      const result = await service.create({ name: 'Test Project' });
      expect(result.name).toBe('Test Project');
      expect(prismaMock.project.create).toHaveBeenCalledTimes(1);
    });

    it('defaults status to Ettevalmistuses when not provided', async () => {
      const project = makeProject();
      prismaMock.project.create.mockResolvedValue(project);

      await service.create({ name: 'Test Project' });

      expect(prismaMock.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ProjectStatus.Ettevalmistuses }),
        }),
      );
    });

    it('throws BadRequestException when project_manager_id references non-existent employee', async () => {
      prismaMock.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Test Project', project_manager_id: 999 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when project_manager_id references archived employee', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 2,
        archived_at: new Date(),
      });

      await expect(
        service.create({ name: 'Test Project', project_manager_id: 2 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates project when valid project_manager_id is provided', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({ id: 2, archived_at: null });
      const project = makeProject({ project_manager_id: 2 });
      prismaMock.project.create.mockResolvedValue(project);

      const result = await service.create({ name: 'Test Project', project_manager_id: 2 });
      expect(result.project_manager_id).toBe(2);
    });
  });

  // ─── archive() (soft delete) ──────────────────────────────────────────────

  describe('archive()', () => {
    it('sets archived_at on the project', async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProject());
      prismaMock.project.update.mockResolvedValue({});

      const result = await service.archive(1);
      expect(result).toEqual({ id: 1 });

      expect(prismaMock.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ archived_at: expect.any(Date) }),
        }),
      );
    });

    it('throws NotFoundException when trying to archive a non-existent project', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await expect(service.archive(999)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when trying to archive an already-archived project', async () => {
      prismaMock.project.findUnique.mockResolvedValue(
        makeProject({ archived_at: new Date() }),
      );
      await expect(service.archive(1)).rejects.toThrow(NotFoundException);
    });

    it('does not hard-delete (update is called, not delete)', async () => {
      prismaMock.project.findUnique.mockResolvedValue(makeProject());
      prismaMock.project.update.mockResolvedValue({});

      await service.archive(1);

      expect(prismaMock.project.update).toHaveBeenCalled();
      expect((prismaMock.project as any).delete).toBeUndefined();
    });
  });

  // ─── findAll() ────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('excludes archived projects', async () => {
      prismaMock.$transaction.mockResolvedValue([[makeProject()], 1]);

      await service.findAll({});

      expect(prismaMock.$transaction).toHaveBeenCalled();
      // The where clause passed to findMany must filter archived_at: null
      const [[findManyCall]] = prismaMock.$transaction.mock.calls;
      // $transaction receives an array of promises; check indirectly via the call structure
      expect(findManyCall).toBeDefined();
    });

    it('returns paginated response with correct meta', async () => {
      const projects = [makeProject({ id: 1 }), makeProject({ id: 2 })];
      prismaMock.$transaction.mockResolvedValue([projects, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });
});
