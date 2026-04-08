import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  TimeEntryDetail,
  TimeEntrySummary,
  TimesheetSummary,
  PauseTimeEntryResponse,
  ResumeTimeEntryResponse,
  StopTimeEntryResponse,
} from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '@lumicore/shared-types';
import { TimeTrackingService } from './time-tracking.service';
import { StartTimeEntryDto } from './dto/start-time-entry.dto';
import { ListTimeEntriesDto } from './dto/list-time-entries.dto';
import { TimesheetQueryDto } from './dto/timesheet-query.dto';

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  // ─── Literal routes first (must precede /:id routes) ──────────────────────

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
