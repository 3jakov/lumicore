import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type {
  TimeEntryDetail,
  TimeEntrySummary,
  TimesheetSummary,
  TeamTimesheetResponse,
  ReportSummaryResponse,
  ReportDetailResponse,
  PauseTimeEntryResponse,
  ResumeTimeEntryResponse,
  StopTimeEntryResponse,
  ActiveTimerEntry,
} from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '@lumicore/shared-types';
import { TimeTrackingService } from './time-tracking.service';
import { StartTimeEntryDto } from './dto/start-time-entry.dto';
import { ListTimeEntriesDto } from './dto/list-time-entries.dto';
import { TimesheetQueryDto } from './dto/timesheet-query.dto';
import { ReportDetailQueryDto } from './dto/report-detail-query.dto';
import type { Response } from 'express';

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  // ─── Literal routes first (must precede /:id routes) ──────────────────────

  /**
   * GET /api/v1/time-entries/praegu
   * Live view of all currently running timers across all employees.
   */
  @Get('praegu')
  getPraegu(): Promise<ActiveTimerEntry[]> {
    return this.timeTrackingService.getPraegu();
  }

  /**
   * GET /api/v1/time-entries/timesheet
   * Self timesheet summary for a date range.
   * Query: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD (both required)
   */
  @Get('timesheet')
  getTimesheet(
    @Query() dto: TimesheetQueryDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<TimesheetSummary> {
    return this.timeTrackingService.getTimesheet(dto, user.id);
  }

  /**
   * GET /api/v1/time-entries/timesheet/team
   * Admin team timesheet grid — all active employees for a date range.
   * Query: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD (both required)
   */
  @Get('timesheet/team')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  getTeamTimesheet(
    @Query() dto: TimesheetQueryDto,
  ): Promise<TeamTimesheetResponse> {
    return this.timeTrackingService.getTeamTimesheet(dto);
  }

  /**
   * GET /api/v1/time-entries/timesheet/export
   * Download an Excel file with the timesheet data for a date range.
   * Query: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD (both required)
   */
  @Get('timesheet/export')
  async exportTimesheet(
    @Query() dto: TimesheetQueryDto,
    @CurrentUserDecorator() user: CurrentUser,
    @Res() res: Response,
  ): Promise<void> {
    const workbook = await this.timeTrackingService.getTimesheetExport(dto, user.id);
    const filename = `timesheet-${dto.date_from}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * GET /api/v1/time-entries/reports/summary
   * Admin — totals per employee for a date range.
   */
  @Get('reports/summary')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  getReportSummary(@Query() dto: TimesheetQueryDto): Promise<ReportSummaryResponse> {
    return this.timeTrackingService.getReportSummary(dto);
  }

  /**
   * GET /api/v1/time-entries/reports/detailed
   * Admin — paginated individual entries. Add ?unassigned_only=true for unassigned tab.
   */
  @Get('reports/detailed')
  @UseGuards(RolesGuard)
  @Roles('Administraator')
  getReportDetailed(@Query() dto: ReportDetailQueryDto): Promise<ReportDetailResponse> {
    return this.timeTrackingService.getReportDetailed(dto);
  }

  /**
   * GET /api/v1/time-entries/active
   * Returns the authenticated employee's currently running timer, or null.
   * Used by mobile to hydrate the timer screen on startup.
   */
  @Get('active')
  async findActive(
    @CurrentUserDecorator() user: CurrentUser,
    @Res() res: import('express').Response,
  ): Promise<void> {
    const entry = await this.timeTrackingService.findActive(user.id);
    // NestJS serialises `null` as an empty body by default.
    // Use res.json() directly so clients always receive valid JSON
    // (either a TimeEntryDetail object or the literal `null`).
    res.json(entry);
  }

  // ─── List ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/time-entries
   * Authenticated employee's own entries.
   * Optional filters: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&project_id=1&page=1&limit=20
   */
  @Get()
  findAll(
    @Query() dto: ListTimeEntriesDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<PaginatedResponse<TimeEntrySummary>> {
    return this.timeTrackingService.findAll(dto, user.id);
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/time-entries
   * Start a timer or create a manual entry.
   * Enforces BR-001 and BR-002.
   * Returns 201 with TimeEntryDetail.
   */
  @Post()
  create(
    @Body() dto: StartTimeEntryDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<TimeEntryDetail> {
    return this.timeTrackingService.create(dto, user.id);
  }

  // ─── Timer actions — declared before :id GET to avoid shadow ──────────────

  /**
   * POST /api/v1/time-entries/:id/pause
   * Pauses an active time entry belonging to the authenticated employee.
   * 400 if already paused or already stopped.
   * 403 if not owner.
   */
  @Post(':id/pause')
  @HttpCode(200)
  pause(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<PauseTimeEntryResponse> {
    return this.timeTrackingService.pause(id, user.id);
  }

  /**
   * POST /api/v1/time-entries/:id/resume
   * Resumes a paused time entry belonging to the authenticated employee.
   * 400 if not currently paused or already stopped.
   * 403 if not owner.
   */
  @Post(':id/resume')
  @HttpCode(200)
  resume(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<ResumeTimeEntryResponse> {
    return this.timeTrackingService.resume(id, user.id);
  }

  /**
   * POST /api/v1/time-entries/:id/stop
   * Stops an active time entry belonging to the authenticated employee.
   * Closes any open pause atomically.
   * 400 if already stopped.
   * 403 if not owner.
   */
  @Post(':id/stop')
  @HttpCode(200)
  stop(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<StopTimeEntryResponse> {
    return this.timeTrackingService.stop(id, user.id);
  }
}
