import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus, ProjectDetail, ProjectSummary } from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import { ListProjectsDto } from './dto/list-projects.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { Project } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── List ─────────────────────────────────────────────────────────────────

  async findAll(dto: ListProjectsDto): Promise<PaginatedResponse<ProjectSummary>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      archived_at: null,
      ...(dto.status ? { status: dto.status } : {}),
    };

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((p) => this.toSummary(p)),
      meta: { total, page, limit },
    };
  }

  // ─── Single ───────────────────────────────────────────────────────────────

  async findOne(id: number): Promise<ProjectDetail> {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project || project.archived_at) {
      throw new NotFoundException(`Project #${id} not found`);
    }

    return this.toDetail(project);
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateProjectDto): Promise<ProjectDetail> {
    if (dto.project_manager_id != null) {
      await this.validateProjectManagerId(dto.project_manager_id);
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        status: dto.status ?? ProjectStatus.Ettevalmistuses,
        description: dto.description ?? null,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        location_address: dto.location_address ?? null,
        location_lat: dto.location_lat ?? null,
        location_lng: dto.location_lng ?? null,
        contract_number: dto.contract_number ?? null,
        project_manager_id: dto.project_manager_id ?? null,
        client_company_name: dto.client_company_name ?? null,
        client_reg_code: dto.client_reg_code ?? null,
        client_contact_name: dto.client_contact_name ?? null,
        client_phone: dto.client_phone ?? null,
        client_email: dto.client_email ?? null,
      },
    });

    return this.toDetail(project);
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateProjectDto): Promise<ProjectDetail> {
    // Verify project exists and is not archived before attempting update
    await this.findOne(id);

    if (dto.project_manager_id != null) {
      await this.validateProjectManagerId(dto.project_manager_id);
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        // Prisma ignores undefined values — only explicitly provided fields are written.
        // Date fields need transformation from ISO string to Date object.
        name: dto.name,
        status: dto.status,
        description: dto.description,
        start_date:
          dto.start_date !== undefined
            ? dto.start_date
              ? new Date(dto.start_date)
              : null
            : undefined,
        end_date:
          dto.end_date !== undefined
            ? dto.end_date
              ? new Date(dto.end_date)
              : null
            : undefined,
        location_address: dto.location_address,
        location_lat: dto.location_lat,
        location_lng: dto.location_lng,
        contract_number: dto.contract_number,
        project_manager_id: dto.project_manager_id,
        client_company_name: dto.client_company_name,
        client_reg_code: dto.client_reg_code,
        client_contact_name: dto.client_contact_name,
        client_phone: dto.client_phone,
        client_email: dto.client_email,
      },
    });

    return this.toDetail(project);
  }

  // ─── Archive (soft delete) ────────────────────────────────────────────────

  async archive(id: number): Promise<{ id: number }> {
    // Verify exists and not already archived
    await this.findOne(id);

    await this.prisma.project.update({
      where: { id },
      data: { archived_at: new Date() },
    });

    return { id };
  }

  // ─── Private validators ───────────────────────────────────────────────────

  /**
   * Throws BadRequestException if the employee does not exist or is archived.
   * Called before any write that sets project_manager_id.
   */
  private async validateProjectManagerId(employeeId: number): Promise<void> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, archived_at: true },
    });

    if (!employee || employee.archived_at) {
      throw new BadRequestException(
        `Employee #${employeeId} does not exist or is archived`,
      );
    }
  }

  // ─── Private mappers ──────────────────────────────────────────────────────

  /**
   * BR-004: display_id prefix derived from status.
   * Hinnapakkumises → "QUOT-{id}", all other statuses → "P-{id}".
   */
  private computeDisplayId(id: number, status: string): string {
    return status === ProjectStatus.Hinnapakkumises ? `QUOT-${id}` : `P-${id}`;
  }

  private toSummary(project: Project): ProjectSummary {
    return {
      id: project.id,
      display_id: this.computeDisplayId(project.id, project.status),
      name: project.name,
      status: project.status as ProjectStatus,
      created_at: project.created_at.toISOString(),
    };
  }

  private toDetail(project: Project): ProjectDetail {
    return {
      ...this.toSummary(project),
      description: project.description,
      start_date: project.start_date ? project.start_date.toISOString().split('T')[0] : null,
      end_date: project.end_date ? project.end_date.toISOString().split('T')[0] : null,
      location_address: project.location_address,
      location_lat: project.location_lat,
      location_lng: project.location_lng,
      contract_number: project.contract_number,
      project_manager_id: project.project_manager_id,
      client_company_name: project.client_company_name,
      client_reg_code: project.client_reg_code,
      client_contact_name: project.client_contact_name,
      client_phone: project.client_phone,
      client_email: project.client_email,
      updated_at: project.updated_at.toISOString(),
    };
  }
}
