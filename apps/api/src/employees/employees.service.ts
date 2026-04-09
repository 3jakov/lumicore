import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CurrentUser,
  EmployeeDetail,
  EmployeeGroup,
  EmployeeStatus,
  EmployeeSummary,
  Language,
  TimeFormat,
} from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import type { Employee } from '@prisma/client';
import { Prisma } from '@prisma/client';

type EmployeeWithRoles = Employee & {
  roles: Array<{ role: { name: string } }>;
};

const ADMIN_ROLE = 'Administraator';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── List ─────────────────────────────────────────────────────────────────

  async findAll(dto: ListEmployeesDto): Promise<PaginatedResponse<EmployeeSummary>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      archived_at: null,
      ...(dto.group ? { group: dto.group } : {}),
    };

    const [employees, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { full_name: 'asc' },
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees.map((e) => this.toSummary(e)),
      meta: { total, page, limit },
    };
  }

  // ─── Single ───────────────────────────────────────────────────────────────

  async findOne(id: number, requestingUser: CurrentUser): Promise<EmployeeDetail> {
    const employee = await this.findActiveById(id);
    const isAdmin = requestingUser.roles.includes(ADMIN_ROLE);
    return this.toDetail(employee, isAdmin);
  }

  // ─── Create (Admin) ───────────────────────────────────────────────────────

  /**
   * POST /api/v1/employees
   * Creates a new employee record with optional role assignments.
   *
   * BR-007 (invitation flow): If phone or email is provided, an invitation
   * SMS/email should be dispatched to onboard the new employee.
   * TODO(BR-007): Invitation delivery is NOT yet implemented.
   *   Hook point: after the employee record is committed, call
   *   `invitationService.sendSmsInvitation(phone, newEmployee.id)` or
   *   `invitationService.sendEmailInvitation(email, newEmployee.id)`.
   *   Implement once SMS/email provider integration is in place.
   */
  async create(dto: CreateEmployeeDto): Promise<EmployeeDetail> {
    await this.assertContactUniqueness(dto.phone, dto.email);

    if (dto.role_ids && dto.role_ids.length > 0) {
      await this.assertRolesExist(dto.role_ids);
    }

    const initials = computeInitials(dto.full_name);
    const avatarColor = pickAvatarColor(dto.full_name);

    const employee = await this.prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          full_name: dto.full_name,
          initials,
          avatar_color: avatarColor,
          group: dto.group,
          phone: dto.phone ?? null,
          email: dto.email ?? null,
          language: dto.language ?? Language.ET,
          time_format: dto.time_format ?? TimeFormat.H24,
          work_schedule: dto.work_schedule ?? null,
          norm_hours_per_week: dto.norm_hours_per_week ?? 40,
          project_access_all: dto.project_access_all ?? true,
          additional_info: dto.additional_info ?? null,
          hourly_rate: dto.hourly_rate ? new Prisma.Decimal(dto.hourly_rate) : null,
          personal_id: dto.personal_id ?? null,
          birth_date: dto.birth_date ? new Date(dto.birth_date) : null,
        },
        include: { roles: { include: { role: true } } },
      });

      if (dto.role_ids && dto.role_ids.length > 0) {
        await tx.employeeRole.createMany({
          data: dto.role_ids.map((roleId) => ({
            employee_id: created.id,
            role_id: roleId,
          })),
        });
      }

      // Reload with fresh role relations after createMany
      return tx.employee.findUniqueOrThrow({
        where: { id: created.id },
        include: { roles: { include: { role: true } } },
      });
    });

    // BR-007 TODO: trigger invitation if phone/email provided
    // if (dto.phone) await invitationService.sendSmsInvitation(dto.phone, employee.id);
    // if (dto.email) await invitationService.sendEmailInvitation(dto.email, employee.id);

    // Admin created the record — always return full detail (sensitive fields visible)
    return this.toDetail(employee, true);
  }

  // ─── Admin update ─────────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/employees/:id
   * Admin updates another employee's profile and/or staff-management fields.
   *
   * BR-007 (invitation flow): If phone or email is set for the FIRST TIME via
   * this endpoint, an invitation should be dispatched.
   * TODO(BR-007): Invitation delivery is NOT yet implemented.
   *   Hook point: compare `existing.phone` and `existing.email` against dto values,
   *   then call `invitationService.send*` when transitioning from null → value.
   *   Implement once SMS/email provider integration is in place.
   */
  async adminUpdate(id: number, dto: UpdateEmployeeDto): Promise<EmployeeDetail> {
    const existing = await this.findActiveById(id);

    // Unique-constraint check for phone/email changes
    if (dto.phone !== undefined && dto.phone !== existing.phone) {
      await this.assertContactUniqueness(dto.phone, undefined, id);
    }
    if (dto.email !== undefined && dto.email !== existing.email) {
      await this.assertContactUniqueness(undefined, dto.email, id);
    }

    if (dto.role_ids !== undefined && dto.role_ids.length > 0) {
      await this.assertRolesExist(dto.role_ids);
    }

    // Recompute initials when full_name changes (must stay in sync — same as /me)
    const updatedInitials =
      dto.full_name !== undefined ? computeInitials(dto.full_name) : undefined;

    const employee = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: {
          ...(dto.full_name !== undefined && { full_name: dto.full_name }),
          ...(updatedInitials !== undefined && { initials: updatedInitials }),
          ...(dto.group !== undefined && { group: dto.group }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.language !== undefined && { language: dto.language }),
          ...(dto.time_format !== undefined && { time_format: dto.time_format }),
          ...(dto.work_schedule !== undefined && { work_schedule: dto.work_schedule }),
          ...(dto.norm_hours_per_week !== undefined && {
            norm_hours_per_week: dto.norm_hours_per_week,
          }),
          ...(dto.project_access_all !== undefined && {
            project_access_all: dto.project_access_all,
          }),
          ...(dto.additional_info !== undefined && { additional_info: dto.additional_info }),
          ...(dto.hourly_rate !== undefined && {
            hourly_rate: new Prisma.Decimal(dto.hourly_rate),
          }),
          ...(dto.personal_id !== undefined && { personal_id: dto.personal_id }),
          ...(dto.birth_date !== undefined && {
            birth_date: new Date(dto.birth_date),
          }),
        },
        include: { roles: { include: { role: true } } },
      });

      // Transactional role replacement when role_ids is explicitly provided
      if (dto.role_ids !== undefined) {
        await tx.employeeRole.deleteMany({ where: { employee_id: id } });
        if (dto.role_ids.length > 0) {
          await tx.employeeRole.createMany({
            data: dto.role_ids.map((roleId) => ({
              employee_id: id,
              role_id: roleId,
            })),
          });
        }
      }

      // Reload with fresh role relations after potential replacement
      return tx.employee.findUniqueOrThrow({
        where: { id: updated.id },
        include: { roles: { include: { role: true } } },
      });
    });

    // BR-007 TODO: trigger invitation on first-time contact assignment
    // const phoneAdded = !existing.phone && dto.phone;
    // const emailAdded = !existing.email && dto.email;
    // if (phoneAdded) await invitationService.sendSmsInvitation(dto.phone!, employee.id);
    // if (emailAdded) await invitationService.sendEmailInvitation(dto.email!, employee.id);

    // Admin operation — always return full detail (sensitive fields visible)
    return this.toDetail(employee, true);
  }

  // ─── Update own profile ───────────────────────────────────────────────────

  async updateOwnProfile(employeeId: number, dto: UpdateOwnProfileDto): Promise<CurrentUser> {
    // Recompute initials when full_name changes (stored in DB, must stay in sync)
    const updatedInitials =
      dto.full_name !== undefined ? computeInitials(dto.full_name) : undefined;

    const employee = await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        full_name: dto.full_name,
        language: dto.language,
        time_format: dto.time_format,
        ...(updatedInitials !== undefined && { initials: updatedInitials }),
      },
      include: { roles: { include: { role: true } } },
    });

    return this.toCurrentUser(employee);
  }

  // ─── Archive (soft delete) ────────────────────────────────────────────────

  async archive(id: number): Promise<{ id: number }> {
    await this.findActiveById(id);

    await this.prisma.employee.update({
      where: { id },
      data: { archived_at: new Date() },
    });

    return { id };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findActiveById(id: number): Promise<EmployeeWithRoles> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });

    if (!employee || employee.archived_at) {
      throw new NotFoundException(`Employee #${id} not found`);
    }

    return employee;
  }

  /**
   * Validates that phone/email are not already in use by another employee.
   * Pass excludeId to skip the current employee (useful on update).
   */
  private async assertContactUniqueness(
    phone?: string,
    email?: string,
    excludeId?: number,
  ): Promise<void> {
    if (phone) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          phone,
          ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(`Phone number '${phone}' is already in use`);
      }
    }

    if (email) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          email,
          ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(`Email '${email}' is already in use`);
      }
    }
  }

  /**
   * Validates that all provided role IDs exist in the Role table.
   * Throws BadRequestException for any unknown IDs (avoids silent FK failures).
   */
  private async assertRolesExist(roleIds: number[]): Promise<void> {
    const found = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((r) => r.id));
    const missing = roleIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Role IDs not found: ${missing.join(', ')}`);
    }
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private toSummary(employee: EmployeeWithRoles): EmployeeSummary {
    return {
      id: employee.id,
      full_name: employee.full_name,
      initials: employee.initials,
      photo_url: employee.photo_url,
      avatar_color: employee.avatar_color,
      group: employee.group as EmployeeGroup,
      status: employee.status as EmployeeStatus,
      roles: employee.roles.map((r) => r.role.name),
    };
  }

  private toDetail(employee: EmployeeWithRoles, includeAdminFields: boolean): EmployeeDetail {
    const base: EmployeeDetail = {
      ...this.toSummary(employee),
      phone: employee.phone,
      email: employee.email,
      language: employee.language as Language,
      time_format: employee.time_format as TimeFormat,
      work_schedule: employee.work_schedule,
      norm_hours_per_week: employee.norm_hours_per_week,
      project_access_all: employee.project_access_all,
      additional_info: employee.additional_info,
      created_at: employee.created_at.toISOString(),
      updated_at: employee.updated_at.toISOString(),
    };

    if (includeAdminFields) {
      base.hourly_rate = employee.hourly_rate ? employee.hourly_rate.toString() : null;
      base.personal_id = employee.personal_id;
      base.birth_date = employee.birth_date
        ? employee.birth_date.toISOString().split('T')[0]
        : null;
    }

    return base;
  }

  /**
   * Maps a full EmployeeWithRoles to CurrentUser.
   * Mirrors auth.service.ts buildCurrentUser — kept here to avoid
   * circular dependency between EmployeesModule and AuthModule.
   */
  private toCurrentUser(employee: EmployeeWithRoles): CurrentUser {
    return {
      id: employee.id,
      full_name: employee.full_name,
      initials: employee.initials,
      photo_url: employee.photo_url,
      avatar_color: employee.avatar_color,
      language: employee.language as Language,
      time_format: employee.time_format as TimeFormat,
      roles: employee.roles.map((r) => r.role.name),
      group: employee.group,
    };
  }
}

// ─── Pure utilities ────────────────────────────────────────────────────────────

/**
 * Derives initials from a full name: first letter of each word, max 2, uppercase.
 * "Jaan Tamm" → "JT" | "Mari-Liis Koppel" → "MK" | "Admin" → "A"
 */
function computeInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Deterministic avatar color derived from the employee's name.
 * Cycles through a fixed palette — same name always yields the same color.
 */
function pickAvatarColor(fullName: string): string {
  const palette = [
    '#4F46E5', // indigo
    '#0891B2', // cyan
    '#059669', // emerald
    '#D97706', // amber
    '#DC2626', // red
    '#7C3AED', // violet
    '#DB2777', // pink
    '#2563EB', // blue
  ];
  const hash = fullName
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}
