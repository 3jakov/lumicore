import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { CurrentUser, EmployeeDetail, EmployeeSummary } from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { EmployeesService } from './employees.service';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // ─── Read (all authenticated users) ──────────────────────────────────────

  /**
   * GET /api/v1/employees
   * Paginated list of active employees. Optional: ?group=Paigaldus&page=1&limit=20
   * Suitable for selectors, team views, and admin tables.
   */
  @Get()
  findAll(@Query() dto: ListEmployeesDto): Promise<PaginatedResponse<EmployeeSummary>> {
    return this.employeesService.findAll(dto);
  }

  /**
   * GET /api/v1/employees/:id
   * Employee detail. Admin-only fields (hourly_rate, personal_id, birth_date)
   * are included only when the requester has the Administraator role (BR-013).
   */
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ): Promise<EmployeeDetail> {
    return this.employeesService.findOne(id, currentUser);
  }

  // ─── Create (Administraator only) ────────────────────────────────────────

  /**
   * POST /api/v1/employees
   * Create a new employee. Admin-only.
   *
   * Returns EmployeeDetail including all admin-visible sensitive fields.
   *
   * BR-007: If phone/email is provided, an invitation should be sent.
   * Invitation delivery is NOT yet implemented — see service-layer TODO.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  create(@Body() dto: CreateEmployeeDto): Promise<EmployeeDetail> {
    return this.employeesService.create(dto);
  }

  // ─── Self-update (own profile) ────────────────────────────────────────────

  /**
   * PATCH /api/v1/employees/me
   * Update own profile (full_name, language, time_format).
   * Returns CurrentUser — compatible with frontend session/profile sync.
   * If full_name changes, initials are recomputed and persisted.
   *
   * NOTE: Route must be declared BEFORE :id to prevent 'me' being parsed
   * as a numeric param by ParseIntPipe.
   */
  @Patch('me')
  updateMe(
    @CurrentUserDecorator() currentUser: CurrentUser,
    @Body() dto: UpdateOwnProfileDto,
  ): Promise<CurrentUser> {
    return this.employeesService.updateOwnProfile(currentUser.id, dto);
  }

  // ─── Admin update (Administraator only) ──────────────────────────────────

  /**
   * PATCH /api/v1/employees/:id
   * Admin updates another employee's profile and staff-management fields.
   * Covers fields not available in PATCH /me:
   *   group, status, roles, hourly_rate, personal_id, birth_date,
   *   work_schedule, norm_hours_per_week, project_access_all, additional_info.
   *
   * Returns EmployeeDetail including all admin-visible sensitive fields.
   *
   * BR-007: If phone/email is set for the first time, an invitation should fire.
   * Invitation delivery is NOT yet implemented — see service-layer TODO.
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  adminUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeDetail> {
    return this.employeesService.adminUpdate(id, dto);
  }

  // ─── Archive (Administraator only) ───────────────────────────────────────

  /**
   * POST /api/v1/employees/:id/archive
   * Soft-archives an employee by setting archived_at.
   * The employee record is retained for audit and historical time-entry references.
   */
  @Post(':id/archive')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  archive(@Param('id', ParseIntPipe) id: number): Promise<{ id: number }> {
    return this.employeesService.archive(id);
  }
}
