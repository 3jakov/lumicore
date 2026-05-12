import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  TaskDetail,
  TaskSummary,
  TaskTemplateSummary,
} from '@lumicore/shared-types';
import { Priority, TaskStatus, TemplateType, EmployeeGroup } from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import { ListTasksDto } from './dto/list-tasks.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { Task, TaskAssignee } from '@prisma/client';

// ─── Internal query result type ───────────────────────────────────────────────

type TaskWithAssignees = Task & {
  assignees: TaskAssignee[];
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Templates ────────────────────────────────────────────────────────────

  async findAllTemplates(): Promise<TaskTemplateSummary[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type as TemplateType,
      sort_order: t.sort_order,
      default_group: t.default_group as EmployeeGroup | null,
      is_active: t.is_active,
    }));
  }

  // ─── List ─────────────────────────────────────────────────────────────────

  async findAll(dto: ListTasksDto): Promise<PaginatedResponse<TaskSummary>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      archived_at: null,
      ...(dto.project_id != null ? { project_id: dto.project_id } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.priority ? { priority: dto.priority } : {}),
      ...(dto.search ? { name: { contains: dto.search, mode: 'insensitive' as const } } : {}),
    };

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { assignees: true },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map((t) => this.toSummary(t)),
      meta: { total, page, limit },
    };
  }

  // ─── Single ───────────────────────────────────────────────────────────────

  async findOne(id: number): Promise<TaskDetail> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });

    if (!task || task.archived_at) {
      throw new NotFoundException(`Task #${id} not found`);
    }

    return this.toDetail(task);
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateTaskDto): Promise<TaskDetail> {
    // Validate references before writing
    if (dto.project_id != null) {
      await this.validateProjectId(dto.project_id);
    }
    if (dto.template_id != null) {
      await this.validateTemplateId(dto.template_id);
    }
    if (dto.assignee_ids && dto.assignee_ids.length > 0) {
      await this.validateEmployeeIds(dto.assignee_ids);
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          name: dto.name,
          status: dto.status ?? TaskStatus.Uus,
          priority: dto.priority ?? Priority.Keskmine,
          project_id: dto.project_id ?? null,
          template_id: dto.template_id ?? null,
          start_time: dto.start_time ? new Date(dto.start_time) : null,
          end_time: dto.end_time ? new Date(dto.end_time) : null,
          location_address: dto.location_address ?? null,
          location_lat: dto.location_lat ?? null,
          location_lng: dto.location_lng ?? null,
        },
        include: { assignees: true },
      });

      if (dto.assignee_ids && dto.assignee_ids.length > 0) {
        await tx.taskAssignee.createMany({
          data: dto.assignee_ids.map((employee_id) => ({
            task_id: created.id,
            employee_id,
          })),
        });

        // Re-fetch with assignees after linking
        return tx.task.findUniqueOrThrow({
          where: { id: created.id },
          include: { assignees: true },
        });
      }

      return created;
    });

    return this.toDetail(task);
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateTaskDto): Promise<TaskDetail> {
    // Verify exists and not archived
    await this.findOne(id);

    if (dto.project_id != null) {
      await this.validateProjectId(dto.project_id);
    }
    if (dto.template_id != null) {
      await this.validateTemplateId(dto.template_id);
    }
    if (dto.assignee_ids && dto.assignee_ids.length > 0) {
      await this.validateEmployeeIds(dto.assignee_ids);
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          // Prisma ignores undefined — only explicitly provided fields are written.
          name: dto.name,
          status: dto.status,
          priority: dto.priority,
          project_id: dto.project_id,
          template_id: dto.template_id,
          start_time:
            dto.start_time !== undefined
              ? dto.start_time
                ? new Date(dto.start_time)
                : null
              : undefined,
          end_time:
            dto.end_time !== undefined
              ? dto.end_time
                ? new Date(dto.end_time)
                : null
              : undefined,
          location_address: dto.location_address,
          location_lat: dto.location_lat,
          location_lng: dto.location_lng,
        },
        include: { assignees: true },
      });

      // Replace assignees only when assignee_ids was explicitly provided in the payload
      if (dto.assignee_ids !== undefined) {
        // Delete all current assignees for this task
        await tx.taskAssignee.deleteMany({ where: { task_id: id } });

        if (dto.assignee_ids.length > 0) {
          await tx.taskAssignee.createMany({
            data: dto.assignee_ids.map((employee_id) => ({
              task_id: id,
              employee_id,
            })),
          });
        }

        // Re-fetch to get fresh assignee list
        return tx.task.findUniqueOrThrow({
          where: { id },
          include: { assignees: true },
        });
      }

      return updated;
    });

    return this.toDetail(task);
  }

  // ─── Archive (soft delete) ────────────────────────────────────────────────

  async archive(id: number): Promise<{ id: number }> {
    // Verify exists and not already archived
    await this.findOne(id);

    await this.prisma.task.update({
      where: { id },
      data: { archived_at: new Date() },
    });

    return { id };
  }

  // ─── Private validators ───────────────────────────────────────────────────

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

  private async validateTemplateId(templateId: number): Promise<void> {
    const template = await this.prisma.taskTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, is_active: true },
    });

    if (!template || !template.is_active) {
      throw new BadRequestException(
        `Task template #${templateId} does not exist or is not active`,
      );
    }
  }

  private async validateEmployeeIds(employeeIds: number[]): Promise<void> {
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, archived_at: true },
    });

    // Check for missing IDs
    const foundIds = new Set(employees.map((e) => e.id));
    const missingIds = employeeIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Employee(s) not found: ${missingIds.join(', ')}`,
      );
    }

    // Check for archived employees
    const archivedIds = employees
      .filter((e) => e.archived_at !== null)
      .map((e) => e.id);
    if (archivedIds.length > 0) {
      throw new BadRequestException(
        `Employee(s) are archived and cannot be assigned: ${archivedIds.join(', ')}`,
      );
    }
  }

  // ─── Private mappers ──────────────────────────────────────────────────────

  private toSummary(task: TaskWithAssignees): TaskSummary {
    return {
      id: task.id,
      name: task.name,
      status: task.status as TaskStatus,
      priority: task.priority as Priority,
      project_id: task.project_id,
      template_id: task.template_id,
      start_time: task.start_time ? task.start_time.toISOString() : null,
      end_time: task.end_time ? task.end_time.toISOString() : null,
      created_at: task.created_at.toISOString(),
      assignee_ids: task.assignees.map((a) => a.employee_id),
    };
  }

  private toDetail(task: TaskWithAssignees): TaskDetail {
    return {
      ...this.toSummary(task),
      location_address: task.location_address,
      location_lat: task.location_lat,
      location_lng: task.location_lng,
      updated_at: task.updated_at.toISOString(),
      archived_at: task.archived_at ? task.archived_at.toISOString() : null,
    };
  }
}
