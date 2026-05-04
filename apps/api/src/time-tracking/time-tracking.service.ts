import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  TimeEntrySummary,
  TimeEntryDetail,
  TimesheetSummary,
  TimesheetDay,
  TeamTimesheetRow,
  TeamTimesheetResponse,
  ReportSummaryRow,
  ReportSummaryResponse,
  ReportDetailRow,
  ReportDetailResponse,
  PauseSummary,
  ActiveTimerEntry,
  TimerStartedEvent,
  TimerPausedEvent,
  TimerResumedEvent,
  TimerStoppedEvent,
} from '@lumicore/shared-types';
import type { PaginatedResponse } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import { StartTimeEntryDto } from './dto/start-time-entry.dto';
import { ListTimeEntriesDto } from './dto/list-time-entries.dto';
import { TimesheetQueryDto } from './dto/timesheet-query.dto';
import { ReportDetailQueryDto } from './dto/report-detail-query.dto';
import type { Pause, TimeEntry } from '@prisma/client';
import { Workbook } from 'exceljs';
import { TimeTrackingGateway } from './time-tracking.gateway';
import { ABSENCE_META } from '../absences/absence-meta';

// ─── Internal query result type ───────────────────────────────────────────────

type TimeEntryWithPauses = TimeEntry & {
  pauses: Pause[];
  project?: { name: string } | null;
  task?: { name: string } | null;
};

// ─── Duration formatter for Excel export ─────────────────────────────────────

function formatDurationExcel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

@Injectable()
export class TimeTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TimeTrackingGateway))
    private readonly gateway: TimeTrackingGateway,
  ) {}

  // ─── Create (start timer or manual entry) ─────────────────────────────────

  /**
   * POST /api/v1/time-entries
   *
   * Two modes:
   *   1. Timer start (is_manual=false or omitted): creates an open entry (ended_at=null).
   *   2. Manual entry (is_manual=true): both started_at and ended_at are required.
   *
   * BR-001: project_id null → no_project_reason required (≥10 chars).
   * BR-002: is_manual=true → started_at < ended_at; zero-duration blocked.
   * BR-003: duration is never stored and never accepted in the request.
   */
  async create(dto: StartTimeEntryDto, employeeId: number): Promise<TimeEntryDetail> {
    // ── BR-001: validate project/reason requirement ────────────────────────
    const hasProject = dto.project_id != null;
    const hasReason =
      dto.no_project_reason != null &&
      dto.no_project_reason.trim().length >= 10;

    if (!hasProject && !hasReason) {
      throw new BadRequestException(
        'Timer requires project+task or a reason (min 10 chars)',
      );
    }

    // ── Validate references ────────────────────────────────────────────────
    if (hasProject) {
      await this.validateProjectId(dto.project_id!);
    }
    if (dto.task_id != null) {
      await this.validateTaskId(dto.task_id, dto.project_id ?? null);
    }

    const isManual = dto.is_manual ?? false;

    if (isManual) {
      // ── BR-002: manual entry requires both timestamps ────────────────────
      if (!dto.started_at || !dto.ended_at) {
        throw new BadRequestException(
          'Manual entries require both started_at and ended_at',
        );
      }

      const startedAt = new Date(dto.started_at);
      const endedAt = new Date(dto.ended_at);

      // BR-002: zero/negative duration blocked
      if (startedAt >= endedAt) {
        throw new BadRequestException('Entry duration cannot be zero');
      }

      const entry = await this.prisma.timeEntry.create({
        data: {
          employee_id: employeeId,
          project_id: dto.project_id ?? null,
          task_id: dto.task_id ?? null,
          no_project_reason: hasProject ? null : (dto.no_project_reason ?? null),
          started_at: startedAt,
          ended_at: endedAt,
          is_manual: true,
          needs_review: false,
          is_confirmed: false,
        },
        include: { pauses: true },
      });

      return this.toDetail(entry);
    }

    // ── Timer start ────────────────────────────────────────────────────────
    const startedAt = dto.started_at ? new Date(dto.started_at) : new Date();

    const entry = await this.prisma.timeEntry.create({
      data: {
        employee_id: employeeId,
        project_id: dto.project_id ?? null,
        task_id: dto.task_id ?? null,
        no_project_reason: hasProject ? null : (dto.no_project_reason ?? null),
        started_at: startedAt,
        ended_at: null,
        is_manual: false,
        needs_review: false,
        is_confirmed: false,
      },
      include: {
        pauses: true,
        project: { select: { name: true } },
        task: { select: { name: true } },
      },
    });

    this.gateway.emitTimerEvent('timer:started', {
      employee_id: employeeId,
      project_id: entry.project_id,
      project_name: entry.project?.name ?? null,
      task_id: entry.task_id,
      task_name: entry.task?.name ?? null,
      started_at: entry.started_at.toISOString(),
    } satisfies TimerStartedEvent);

    return this.toDetail(entry);
  }

  // ─── Pause ─────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/time-entries/:id/pause
   *
   * Requirements:
   * - Entry must exist and belong to the authenticated employee.
   * - Entry must be active (ended_at is null).
   * - Entry must not already be paused (no open Pause row).
   *
   * Creates an open Pause (pause_end=null).
   */
  async pause(id: number, employeeId: number): Promise<TimeEntryDetail> {
    const entry = await this.findEntryOrThrow(id);
    this.assertOwnership(entry, employeeId);
    this.assertActive(entry, 'pause');

    const openPause = entry.pauses.find((p) => p.pause_end === null);
    if (openPause) {
      throw new BadRequestException('Time entry is already paused');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.pause.create({
        data: {
          time_entry_id: id,
          pause_start: new Date(),
          pause_end: null,
        },
      });

      return tx.timeEntry.findUniqueOrThrow({
        where: { id },
        include: { pauses: true },
      });
    });

    this.gateway.emitTimerEvent('timer:paused', {
      employee_id: employeeId,
      time_entry_id: id,
    } satisfies TimerPausedEvent);

    return this.toDetail(updated);
  }

  // ─── Resume ────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/time-entries/:id/resume
   *
   * Requirements:
   * - Entry must exist and belong to the authenticated employee.
   * - Entry must be active (ended_at is null).
   * - Entry must currently be paused (an open Pause row exists).
   *
   * Closes the open Pause by setting pause_end = now().
   */
  async resume(id: number, employeeId: number): Promise<TimeEntryDetail> {
    const entry = await this.findEntryOrThrow(id);
    this.assertOwnership(entry, employeeId);
    this.assertActive(entry, 'resume');

    const openPause = entry.pauses.find((p) => p.pause_end === null);
    if (!openPause) {
      throw new BadRequestException('Time entry is not currently paused');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.pause.update({
        where: { id: openPause.id },
        data: { pause_end: new Date() },
      });

      return tx.timeEntry.findUniqueOrThrow({
        where: { id },
        include: { pauses: true },
      });
    });

    this.gateway.emitTimerEvent('timer:resumed', {
      employee_id: employeeId,
      time_entry_id: id,
    } satisfies TimerResumedEvent);

    return this.toDetail(updated);
  }

  // ─── Stop ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/time-entries/:id/stop
   *
   * Requirements:
   * - Entry must exist and belong to the authenticated employee.
   * - Entry must be active (ended_at is null).
   *
   * If currently paused, closes the open Pause first, then sets ended_at.
   * All writes are atomic (single transaction).
   */
  async stop(id: number, employeeId: number): Promise<TimeEntryDetail> {
    const entry = await this.findEntryOrThrow(id);
    this.assertOwnership(entry, employeeId);
    this.assertActive(entry, 'stop');

    const now = new Date();
    const openPause = entry.pauses.find((p) => p.pause_end === null);

    const updated = await this.prisma.$transaction(async (tx) => {
      // Close any open pause first
      if (openPause) {
        await tx.pause.update({
          where: { id: openPause.id },
          data: { pause_end: now },
        });
      }

      // BR-002 guard: validate duration BEFORE writing ended_at so the
      // transaction rolls back cleanly if the guard trips.
      const simulatedPauses = entry.pauses.map((p) =>
        p.id === openPause?.id ? { ...p, pause_end: now } : p,
      );
      const simulatedDuration = this.computeDurationSeconds({
        ...entry,
        ended_at: now,
        pauses: simulatedPauses,
      });
      if (simulatedDuration !== null && simulatedDuration <= 0) {
        throw new BadRequestException('Entry duration cannot be zero');
      }

      // Set ended_at on the entry
      await tx.timeEntry.update({
        where: { id },
        data: { ended_at: now },
      });

      return tx.timeEntry.findUniqueOrThrow({
        where: { id },
        include: { pauses: true },
      });
    });

    this.gateway.emitTimerEvent('timer:stopped', {
      employee_id: employeeId,
      time_entry_id: id,
    } satisfies TimerStoppedEvent);

    return this.toDetail(updated);
  }

  // ─── List (self) ───────────────────────────────────────────────────────────

  /**
   * GET /api/v1/time-entries
   * Returns the authenticated employee's own time entries.
   * Filterable by date range and project_id.
   */
  async findAll(
    dto: ListTimeEntriesDto,
    employeeId: number,
  ): Promise<PaginatedResponse<TimeEntrySummary>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildListWhere(dto, employeeId);

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.timeEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { started_at: 'desc' },
        include: { pauses: true },
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    return {
      data: entries.map((e) => this.toSummary(e)),
      meta: { total, page, limit },
    };
  }

  // ─── Timesheet (self) ──────────────────────────────────────────────────────

  /**
   * GET /api/v1/time-entries/timesheet
   * Returns the authenticated employee's self timesheet summary for a date range.
   * Duration is computed from timestamps + pauses (BR-003).
   * Days are grouped in Europe/Tallinn timezone.
   */
  async getTimesheet(
    dto: TimesheetQueryDto,
    employeeId: number,
  ): Promise<TimesheetSummary> {
    const dateFrom = this.tallinDayBoundary(dto.date_from, false); // start of day Tallinn
    const dateTo = this.tallinDayBoundary(dto.date_to, true);     // end of day Tallinn

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        employee_id: employeeId,
        started_at: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: { pauses: true },
      orderBy: { started_at: 'asc' },
    });

    // Build a map: YYYY-MM-DD (Tallinn local date) → tracked seconds + count
    const dayMap = new Map<string, { tracked_seconds: number; entry_count: number }>();

    // Ensure every date in the range is represented even with 0 entries
    const currentDate = new Date(dto.date_from);
    const endDate = new Date(dto.date_to);
    while (currentDate <= endDate) {
      const key = currentDate.toISOString().slice(0, 10); // approximate — will be overridden
      // Build proper YYYY-MM-DD in Tallinn
      const tallinKey = this.toTallinDate(currentDate);
      if (!dayMap.has(tallinKey)) {
        dayMap.set(tallinKey, { tracked_seconds: 0, entry_count: 0 });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let totalTracked = 0;

    for (const entry of entries) {
      const duration = this.computeDurationSeconds(entry);
      if (duration === null) continue; // running timer — exclude from summary

      const dateKey = this.toTallinDate(entry.started_at);
      const existing = dayMap.get(dateKey) ?? { tracked_seconds: 0, entry_count: 0 };
      existing.tracked_seconds += duration;
      existing.entry_count += 1;
      dayMap.set(dateKey, existing);
      totalTracked += duration;
    }

    // Sort days chronologically
    const days: TimesheetDay[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({
        date,
        tracked_seconds: val.tracked_seconds,
        entry_count: val.entry_count,
      }));

    return {
      employee_id: employeeId,
      date_from: dto.date_from,
      date_to: dto.date_to,
      total_tracked_seconds: totalTracked,
      days,
    };
  }

  // ─── Timesheet (team / admin) ─────────────────────────────────────────────

  /**
   * GET /api/v1/time-entries/timesheet/team
   * Admin endpoint — returns a monthly grid for all active employees.
   * Rows are ordered by full_name. Durations computed from timestamps + pauses (BR-003).
   */
  async getTeamTimesheet(dto: TimesheetQueryDto): Promise<TeamTimesheetResponse> {
    const dateFrom = this.tallinDayBoundary(dto.date_from, false);
    const dateTo = this.tallinDayBoundary(dto.date_to, true);

    // 1. All active employees (ordered by name)
    const employees = await this.prisma.employee.findMany({
      where: { archived_at: null },
      orderBy: { full_name: 'asc' },
      select: {
        id: true,
        full_name: true,
        initials: true,
        avatar_color: true,
        norm_hours_per_week: true,
      },
    });

    // 2. All closed time entries in the range across all employees
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        started_at: { gte: dateFrom, lte: dateTo },
        ended_at: { not: null },
      },
      include: { pauses: true },
      orderBy: { started_at: 'asc' },
    });

    // 2b. All absences overlapping the range
    const absences = await this.prisma.absence.findMany({
      where: {
        date_from: { lte: new Date(dto.date_to) },
        date_to: { gte: new Date(dto.date_from) },
      },
    });

    // 3. Build ordered date list for the range
    const dates: string[] = [];
    const cursor = new Date(dto.date_from);
    const end = new Date(dto.date_to);
    while (cursor <= end) {
      dates.push(this.toTallinDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    // 4. Count Mon–Fri working days in the range
    const workingDaysList = dates.filter((d) => {
      const dow = new Date(d + 'T12:00:00Z').getUTCDay(); // 0=Sun, 6=Sat
      return dow >= 1 && dow <= 5;
    });
    const workingDays = workingDaysList.length;

    // 5. Group entries by employee_id
    const byEmployee = new Map<number, typeof entries>();
    for (const entry of entries) {
      const list = byEmployee.get(entry.employee_id) ?? [];
      list.push(entry);
      byEmployee.set(entry.employee_id, list);
    }

    // 5b. Group absences by employee_id
    const absencesByEmployee = new Map<number, typeof absences>();
    for (const absence of absences) {
      const list = absencesByEmployee.get(absence.employee_id) ?? [];
      list.push(absence);
      absencesByEmployee.set(absence.employee_id, list);
    }

    // 6. Build one row per employee
    const rows: TeamTimesheetRow[] = employees.map((emp) => {
      const empEntries = byEmployee.get(emp.id) ?? [];
      const daySeconds: Record<string, number> = {};
      let totalSeconds = 0;

      for (const entry of empEntries) {
        const duration = this.computeDurationSeconds(entry);
        if (duration === null || duration <= 0) continue;
        const dateKey = this.toTallinDate(entry.started_at);
        daySeconds[dateKey] = (daySeconds[dateKey] ?? 0) + duration;
        totalSeconds += duration;
      }

      // Build day_absences map; use Set to avoid double-counting overlapping absences
      const empAbsences = absencesByEmployee.get(emp.id) ?? [];
      const dayAbsences: Record<string, { id: number; code: string }> = {};
      const normReducingDatesSet = new Set<string>();

      for (const absence of empAbsences) {
        const meta = ABSENCE_META[absence.type];
        const abFrom = absence.date_from.toISOString().slice(0, 10);
        const abTo = absence.date_to.toISOString().slice(0, 10);

        for (const date of workingDaysList) {
          if (date >= abFrom && date <= abTo) {
            dayAbsences[date] = { id: absence.id, code: meta.code };
            if (meta.reduces_norm) normReducingDatesSet.add(date);
          }
        }
      }

      const absenceNormReductionDays = normReducingDatesSet.size;

      const dailyNormSeconds = Math.round((emp.norm_hours_per_week / 5) * 3600);
      const normSeconds = workingDays * dailyNormSeconds;
      const adjustedNormSeconds = Math.max(0, (workingDays - absenceNormReductionDays) * dailyNormSeconds);

      return {
        employee_id: emp.id,
        employee_name: emp.full_name,
        initials: emp.initials,
        avatar_color: emp.avatar_color,
        day_seconds: daySeconds,
        day_absences: dayAbsences,
        working_days: workingDays,
        norm_seconds: normSeconds,
        adjusted_norm_seconds: adjustedNormSeconds,
        total_seconds: totalSeconds,
        overtime_seconds: totalSeconds - adjustedNormSeconds,
      };
    });

    return {
      date_from: dto.date_from,
      date_to: dto.date_to,
      dates,
      rows,
    };
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/time-entries/reports/summary
   * Admin — totals per active employee for a date range.
   */
  async getReportSummary(dto: TimesheetQueryDto): Promise<ReportSummaryResponse> {
    const dateFrom = this.tallinDayBoundary(dto.date_from, false);
    const dateTo = this.tallinDayBoundary(dto.date_to, true);

    const employees = await this.prisma.employee.findMany({
      where: { archived_at: null },
      orderBy: { full_name: 'asc' },
      select: {
        id: true,
        full_name: true,
        initials: true,
        avatar_color: true,
        group: true,
        norm_hours_per_week: true,
      },
    });

    const entries = await this.prisma.timeEntry.findMany({
      where: { started_at: { gte: dateFrom, lte: dateTo }, ended_at: { not: null } },
      include: { pauses: true },
    });

    // Count Mon–Fri working days in range
    const cursor = new Date(dto.date_from);
    const end = new Date(dto.date_to);
    let workingDays = 0;
    while (cursor <= end) {
      const dow = cursor.getUTCDay();
      if (dow >= 1 && dow <= 5) workingDays++;
      cursor.setDate(cursor.getDate() + 1);
    }

    const byEmployee = new Map<number, { totalSeconds: number; entryCount: number }>();
    for (const entry of entries) {
      const duration = this.computeDurationSeconds(entry);
      if (duration === null || duration <= 0) continue;
      const existing = byEmployee.get(entry.employee_id) ?? { totalSeconds: 0, entryCount: 0 };
      existing.totalSeconds += duration;
      existing.entryCount += 1;
      byEmployee.set(entry.employee_id, existing);
    }

    const rows: ReportSummaryRow[] = employees.map((emp) => {
      const agg = byEmployee.get(emp.id) ?? { totalSeconds: 0, entryCount: 0 };
      const normSeconds = workingDays * Math.round((emp.norm_hours_per_week / 5) * 3600);
      return {
        employee_id: emp.id,
        employee_name: emp.full_name,
        initials: emp.initials,
        avatar_color: emp.avatar_color,
        group: emp.group,
        total_seconds: agg.totalSeconds,
        working_days: workingDays,
        norm_seconds: normSeconds,
        overtime_seconds: agg.totalSeconds - normSeconds,
        entry_count: agg.entryCount,
      };
    });

    return { date_from: dto.date_from, date_to: dto.date_to, rows };
  }

  /**
   * GET /api/v1/time-entries/reports/detailed
   * Admin — paginated list of individual time entries with employee/project/task names.
   * Pass unassigned_only=true to filter to entries without a project.
   */
  async getReportDetailed(dto: ReportDetailQueryDto): Promise<ReportDetailResponse> {
    const dateFrom = this.tallinDayBoundary(dto.date_from, false);
    const dateTo = this.tallinDayBoundary(dto.date_to, true);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const skip = (page - 1) * limit;

    const where = {
      started_at: { gte: dateFrom, lte: dateTo },
      ...(dto.employee_id != null ? { employee_id: dto.employee_id } : {}),
      ...(dto.project_id != null ? { project_id: dto.project_id } : {}),
      ...(dto.unassigned_only ? { project_id: null } : {}),
    };

    const [entries, total] = await this.prisma.$transaction([
      this.prisma.timeEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { started_at: 'desc' },
        include: {
          pauses: true,
          employee: { select: { full_name: true, initials: true, avatar_color: true } },
          project: { select: { name: true } },
          task: { select: { name: true } },
        },
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    const data: ReportDetailRow[] = entries.map((e) => ({
      id: e.id,
      employee_id: e.employee_id,
      employee_name: e.employee.full_name,
      initials: e.employee.initials,
      avatar_color: e.employee.avatar_color,
      project_id: e.project_id,
      project_name: e.project?.name ?? null,
      task_id: e.task_id,
      task_name: e.task?.name ?? null,
      started_at: e.started_at.toISOString(),
      ended_at: e.ended_at ? e.ended_at.toISOString() : null,
      duration_seconds: this.computeDurationSeconds(e),
      is_manual: e.is_manual,
      no_project_reason: e.no_project_reason,
    }));

    return { date_from: dto.date_from, date_to: dto.date_to, data, meta: { total, page, limit } };
  }

  // ─── Praegu (live view) ────────────────────────────────────────────────────

  /**
   * GET /api/v1/time-entries/praegu
   * Returns all currently active (running) timers across all employees.
   * Used by the Praegu live-view board.
   */
  async getPraegu(): Promise<ActiveTimerEntry[]> {
    const entries = await this.prisma.timeEntry.findMany({
      where: { ended_at: null },
      include: {
        employee: { select: { full_name: true } },
        project: { select: { name: true } },
        task: { select: { name: true } },
        pauses: true,
      },
      orderBy: { started_at: 'asc' },
    });

    return entries.map((entry) => {
      const isPaused = entry.pauses.some((p) => p.pause_end === null);

      // Sum closed pauses
      let pauseDurationSeconds = 0;
      for (const p of entry.pauses) {
        if (p.pause_end !== null) {
          pauseDurationSeconds += Math.floor(
            (p.pause_end.getTime() - p.pause_start.getTime()) / 1000,
          );
        } else {
          // Open pause — count up to now
          pauseDurationSeconds += Math.floor(
            (Date.now() - p.pause_start.getTime()) / 1000,
          );
        }
      }

      return {
        employee_id: entry.employee_id,
        employee_name: entry.employee.full_name,
        time_entry_id: entry.id,
        project_id: entry.project_id,
        project_name: entry.project?.name ?? null,
        task_id: entry.task_id,
        task_name: entry.task?.name ?? null,
        started_at: entry.started_at.toISOString(),
        is_paused: isPaused,
        pause_duration_seconds: pauseDurationSeconds,
      } satisfies ActiveTimerEntry;
    });
  }

  // ─── Timesheet Excel export ────────────────────────────────────────────────

  /**
   * GET /api/v1/time-entries/timesheet/export
   * Returns an ExcelJS Workbook with the timesheet data for downloading.
   */
  async getTimesheetExport(dto: TimesheetQueryDto, employeeId: number): Promise<Workbook> {
    const summary = await this.getTimesheet(dto, employeeId);

    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Timesheet');

    // Header row
    sheet.addRow(['Date', 'Tracked', 'Entries']);

    // Data rows
    for (const day of summary.days) {
      sheet.addRow([
        day.date,
        formatDurationExcel(day.tracked_seconds),
        day.entry_count,
      ]);
    }

    // Total row
    sheet.addRow(['Total', formatDurationExcel(summary.total_tracked_seconds), '']);

    return workbook;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findEntryOrThrow(id: number): Promise<TimeEntryWithPauses> {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id },
      include: { pauses: true },
    });
    if (!entry) {
      throw new NotFoundException(`Time entry #${id} not found`);
    }
    return entry;
  }

  private assertOwnership(entry: TimeEntry, employeeId: number): void {
    if (entry.employee_id !== employeeId) {
      throw new ForbiddenException('You do not have access to this time entry');
    }
  }

  private assertActive(entry: TimeEntry, action: string): void {
    if (entry.ended_at !== null) {
      throw new BadRequestException(
        `Cannot ${action} a time entry that has already been stopped`,
      );
    }
  }

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

  private async validateTaskId(taskId: number, projectId: number | null): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, archived_at: true, project_id: true },
    });
    if (!task || task.archived_at) {
      throw new BadRequestException(
        `Task #${taskId} does not exist or is archived`,
      );
    }
    // If a project is provided, ensure the task belongs to that project
    if (projectId != null && task.project_id !== null && task.project_id !== projectId) {
      throw new BadRequestException(
        `Task #${taskId} does not belong to project #${projectId}`,
      );
    }
  }

  private buildListWhere(dto: ListTimeEntriesDto, employeeId: number) {
    const where: Record<string, unknown> = { employee_id: employeeId };

    if (dto.date_from || dto.date_to) {
      const startedAt: Record<string, Date> = {};
      if (dto.date_from) {
        startedAt.gte = this.tallinDayBoundary(dto.date_from, false);
      }
      if (dto.date_to) {
        startedAt.lte = this.tallinDayBoundary(dto.date_to, true);
      }
      where.started_at = startedAt;
    }

    if (dto.project_id != null) {
      where.project_id = dto.project_id;
    }

    return where;
  }

  /**
   * Compute net duration in seconds.
   * Returns null if the entry has no ended_at (timer still running).
   * BR-003: duration derived from timestamps and pauses, never persisted.
   */
  private computeDurationSeconds(entry: TimeEntryWithPauses): number | null {
    if (!entry.ended_at) return null;

    const totalSeconds =
      (entry.ended_at.getTime() - entry.started_at.getTime()) / 1000;

    const pauseSeconds = this.computePauseSeconds(entry.pauses);

    return Math.max(0, Math.round(totalSeconds - pauseSeconds));
  }

  /**
   * Compute total pause duration in seconds.
   * Open pauses (pause_end=null) are counted up to now().
   */
  private computePauseSeconds(pauses: Pause[]): number {
    const now = Date.now();
    return pauses.reduce((acc, p) => {
      const end = p.pause_end ? p.pause_end.getTime() : now;
      return acc + Math.max(0, (end - p.pause_start.getTime()) / 1000);
    }, 0);
  }

  /**
   * Convert a UTC Date to YYYY-MM-DD in Europe/Tallinn timezone.
   * Uses Intl to correctly handle DST (UTC+2 winter / UTC+3 summer).
   */
  private toTallinDate(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Tallinn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  /**
   * Convert a YYYY-MM-DD date string to a UTC Date representing either the
   * start (00:00:00) or end (23:59:59) of that calendar day in Europe/Tallinn.
   *
   * Uses the offset-correction technique: build a naive UTC instant for the
   * desired local time, then measure how far Tallinn's local clock is from UTC
   * at that moment and shift accordingly. This handles DST correctly without
   * requiring date-fns-tz or any additional dependencies.
   */
  private tallinDayBoundary(dateStr: string, endOfDay: boolean): Date {
    const timeStr = endOfDay ? 'T23:59:59' : 'T00:00:00';
    // Step 1: treat the desired local time as if it were UTC (naive estimate)
    const estimate = new Date(dateStr + timeStr + 'Z');

    // Step 2: find out what Tallinn local time corresponds to this UTC instant
    const tallinLocalStr = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Tallinn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(estimate); // sv-SE → "YYYY-MM-DD HH:mm:ss"

    // Step 3: parse that Tallinn local string back as UTC to get the offset gap
    const tallinAsUtc = new Date(tallinLocalStr.replace(' ', 'T') + 'Z');

    // Step 4: the true UTC instant for the desired local time is:
    //   estimate - (tallinAsUtc - estimate)  =  2 * estimate - tallinAsUtc
    const offsetMs = tallinAsUtc.getTime() - estimate.getTime();
    return new Date(estimate.getTime() - offsetMs);
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private toSummary(entry: TimeEntryWithPauses): TimeEntrySummary {
    const durationSeconds = this.computeDurationSeconds(entry);
    const pauseDurationSeconds = Math.round(this.computePauseSeconds(entry.pauses));
    const isPaused = entry.pauses.some((p) => p.pause_end === null);

    return {
      id: entry.id,
      employee_id: entry.employee_id,
      project_id: entry.project_id,
      task_id: entry.task_id,
      no_project_reason: entry.no_project_reason,
      started_at: entry.started_at.toISOString(),
      ended_at: entry.ended_at ? entry.ended_at.toISOString() : null,
      is_manual: entry.is_manual,
      needs_review: entry.needs_review,
      is_confirmed: entry.is_confirmed,
      duration_seconds: durationSeconds,
      pause_duration_seconds: pauseDurationSeconds,
      is_paused: isPaused,
      created_at: entry.created_at.toISOString(),
    };
  }

  private toDetail(entry: TimeEntryWithPauses): TimeEntryDetail {
    const pauses: PauseSummary[] = entry.pauses.map((p) => ({
      id: p.id,
      pause_start: p.pause_start.toISOString(),
      pause_end: p.pause_end ? p.pause_end.toISOString() : null,
    }));

    return {
      ...this.toSummary(entry),
      pauses,
      updated_at: entry.updated_at.toISOString(),
    };
  }
}
