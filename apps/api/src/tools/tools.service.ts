import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ToolDetail, ToolSummary } from '@lumicore/shared-types';
import { ToolStatus } from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import { ListToolsDto } from './dto/list-tools.dto';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import type { Tool } from '@prisma/client';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── List ─────────────────────────────────────────────────────────────────

  async findAll(dto: ListToolsDto): Promise<PaginatedResponse<ToolSummary>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      archived_at: null,
      ...(dto.status ? { status: dto.status } : {}),
    };

    const [tools, total] = await this.prisma.$transaction([
      this.prisma.tool.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.tool.count({ where }),
    ]);

    return {
      data: tools.map((t) => this.toSummary(t)),
      meta: { total, page, limit },
    };
  }

  // ─── Single ───────────────────────────────────────────────────────────────

  async findOne(id: number): Promise<ToolDetail> {
    const tool = await this.prisma.tool.findUnique({ where: { id } });

    if (!tool || tool.archived_at) {
      throw new NotFoundException(`Tool #${id} not found`);
    }

    return this.toDetail(tool);
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateToolDto): Promise<ToolDetail> {
    if (dto.current_location_project_id != null) {
      await this.validateProjectId(dto.current_location_project_id);
    }
    if (dto.responsible_employee_id != null) {
      await this.validateEmployeeId(dto.responsible_employee_id);
    }

    const tool = await this.prisma.tool.create({
      data: {
        name: dto.name,
        status: dto.status ?? ToolStatus.Tookorras,
        code: dto.code ?? null,
        photo_s3_key: dto.photo_s3_key ?? null,
        current_location_project_id: dto.current_location_project_id ?? null,
        current_location_text: dto.current_location_text ?? null,
        responsible_employee_id: dto.responsible_employee_id ?? null,
        description: dto.description ?? null,
        manufacturer: dto.manufacturer ?? null,
        model: dto.model ?? null,
      },
    });

    return this.toDetail(tool);
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateToolDto): Promise<ToolDetail> {
    // Verify exists and not archived before attempting update
    await this.findOne(id);

    if (dto.current_location_project_id != null) {
      await this.validateProjectId(dto.current_location_project_id);
    }
    if (dto.responsible_employee_id != null) {
      await this.validateEmployeeId(dto.responsible_employee_id);
    }

    const tool = await this.prisma.tool.update({
      where: { id },
      data: {
        // Prisma ignores undefined values — only explicitly provided fields are written.
        name: dto.name,
        status: dto.status,
        code: dto.code,
        photo_s3_key: dto.photo_s3_key,
        current_location_project_id: dto.current_location_project_id,
        current_location_text: dto.current_location_text,
        responsible_employee_id: dto.responsible_employee_id,
        description: dto.description,
        manufacturer: dto.manufacturer,
        model: dto.model,
      },
    });

    return this.toDetail(tool);
  }

  // ─── Archive (soft delete) ────────────────────────────────────────────────

  async archive(id: number): Promise<{ id: number }> {
    // Verify exists and not already archived
    await this.findOne(id);

    await this.prisma.tool.update({
      where: { id },
      data: { archived_at: new Date() },
    });

    return { id };
  }

  // ─── Private validators ───────────────────────────────────────────────────

  /**
   * Throws BadRequestException if the project does not exist or is archived.
   */
  private async validateProjectId(projectId: number): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, archived_at: true },
    });

    if (!project || project.archived_at) {
      throw new BadRequestException(
        `Project #${projectId} does not exist or is archived`,
      );
    }
  }

  /**
   * Throws BadRequestException if the employee does not exist or is archived.
   */
  private async validateEmployeeId(employeeId: number): Promise<void> {
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

  private toSummary(tool: Tool): ToolSummary {
    return {
      id: tool.id,
      name: tool.name,
      code: tool.code,
      status: tool.status as ToolStatus,
      current_location_project_id: tool.current_location_project_id,
      current_location_text: tool.current_location_text,
      responsible_employee_id: tool.responsible_employee_id,
      created_at: tool.created_at.toISOString(),
    };
  }

  private toDetail(tool: Tool): ToolDetail {
    return {
      ...this.toSummary(tool),
      photo_s3_key: tool.photo_s3_key,
      description: tool.description,
      manufacturer: tool.manufacturer,
      model: tool.model,
      updated_at: tool.updated_at.toISOString(),
      archived_at: tool.archived_at ? tool.archived_at.toISOString() : null,
    };
  }
}
