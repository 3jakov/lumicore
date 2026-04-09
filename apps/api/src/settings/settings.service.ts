import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { RoleSummary, TagSummary, GroupSummary } from '@lumicore/shared-types';
import { EmployeeGroup, TagEntityType } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Roles ────────────────────────────────────────────────────────────────

  async getRoles(): Promise<RoleSummary[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      created_at: r.created_at.toISOString(),
    }));
  }

  async createRole(dto: CreateRoleDto): Promise<RoleSummary> {
    try {
      const role = await this.prisma.role.create({
        data: { name: dto.name },
      });

      return {
        id: role.id,
        name: role.name,
        created_at: role.created_at.toISOString(),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Role name already exists');
      }
      throw err;
    }
  }

  async updateRole(id: number, dto: UpdateRoleDto): Promise<RoleSummary> {
    // Verify exists
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    try {
      const role = await this.prisma.role.update({
        where: { id },
        data: { name: dto.name },
      });

      return {
        id: role.id,
        name: role.name,
        created_at: role.created_at.toISOString(),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Role name already exists');
      }
      throw err;
    }
  }

  async deleteRole(id: number): Promise<void> {
    // Verify exists
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    // Check for employee references
    const assignedCount = await this.prisma.employeeRole.count({
      where: { role_id: id },
    });

    if (assignedCount > 0) {
      throw new ConflictException(
        `Role is assigned to ${assignedCount} employee(s) and cannot be deleted`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
  }

  // ─── Groups (read-only) ───────────────────────────────────────────────────

  getGroups(): GroupSummary[] {
    return Object.values(EmployeeGroup).map((value) => ({ value }));
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  async getTags(entity_type?: TagEntityType): Promise<TagSummary[]> {
    const tags = await this.prisma.tag.findMany({
      where: {
        archived_at: null,
        ...(entity_type ? { entity_type } : {}),
      },
      orderBy: { name: 'asc' },
    });

    return tags.map((t) => this.toTagSummary(t));
  }

  async createTag(dto: CreateTagDto): Promise<TagSummary> {
    try {
      const tag = await this.prisma.tag.create({
        data: {
          name: dto.name,
          entity_type: dto.entity_type,
          color: dto.color ?? '#6B7280',
        },
      });

      return this.toTagSummary(tag);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'A tag with this name already exists for this entity type',
        );
      }
      throw err;
    }
  }

  async updateTag(id: number, dto: UpdateTagDto): Promise<TagSummary> {
    // Verify exists and not archived
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing || existing.archived_at !== null) {
      throw new NotFoundException(`Tag #${id} not found`);
    }

    try {
      const tag = await this.prisma.tag.update({
        where: { id },
        data: {
          name: dto.name,
          color: dto.color,
        },
      });

      return this.toTagSummary(tag);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'A tag with this name already exists for this entity type',
        );
      }
      throw err;
    }
  }

  async deleteTag(id: number): Promise<void> {
    // Verify exists and not already archived
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing || existing.archived_at !== null) {
      throw new NotFoundException(`Tag #${id} not found`);
    }

    await this.prisma.tag.update({
      where: { id },
      data: { archived_at: new Date() },
    });
  }

  // ─── Private mappers ──────────────────────────────────────────────────────

  private toTagSummary(tag: {
    id: number;
    name: string;
    color: string;
    entity_type: string;
    created_at: Date;
  }): TagSummary {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      entity_type: tag.entity_type as TagEntityType,
      created_at: tag.created_at.toISOString(),
    };
  }
}
