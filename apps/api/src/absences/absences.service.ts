// Absences module — employee absences/time-off management
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { AbsenceSummary } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { ListAbsencesDto } from './dto/list-absences.dto';
import { ABSENCE_META } from './absence-meta';
import type { Absence } from '@prisma/client';

type AbsenceRow = Absence & {
  employee: { full_name: string };
};

@Injectable()
export class AbsencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAbsenceDto, createdById: number): Promise<AbsenceSummary> {
    if (dto.date_to < dto.date_from) {
      throw new BadRequestException('date_to must be >= date_from');
    }

    const absence = await this.prisma.absence.create({
      data: {
        employee_id: dto.employee_id,
        type: dto.type,
        date_from: new Date(dto.date_from),
        date_to: new Date(dto.date_to),
        comment: dto.comment ?? null,
        created_by_id: createdById,
      },
      include: {
        employee: { select: { full_name: true } },
      },
    });

    return this.toSummary(absence as AbsenceRow);
  }

  async findAll(dto: ListAbsencesDto): Promise<AbsenceSummary[]> {
    const where: Record<string, unknown> = {};

    if (dto.employee_id !== undefined) {
      where.employee_id = dto.employee_id;
    }
    // Range overlap: absence overlaps query window when date_from <= dateTo AND date_to >= dateFrom
    if (dto.date_from || dto.date_to) {
      if (dto.date_to) where.date_from = { lte: new Date(dto.date_to) };
      if (dto.date_from) where.date_to = { gte: new Date(dto.date_from) };
    }

    const absences = await this.prisma.absence.findMany({
      where,
      include: { employee: { select: { full_name: true } } },
      orderBy: { date_from: 'desc' },
    });

    return (absences as AbsenceRow[]).map((a) => this.toSummary(a));
  }

  async findMine(employeeId: number): Promise<AbsenceSummary[]> {
    const absences = await this.prisma.absence.findMany({
      where: { employee_id: employeeId },
      include: { employee: { select: { full_name: true } } },
      orderBy: { date_from: 'desc' },
    });
    return (absences as AbsenceRow[]).map((a) => this.toSummary(a));
  }

  async remove(id: number): Promise<void> {
    const absence = await this.prisma.absence.findUnique({ where: { id } });
    if (!absence) throw new NotFoundException(`Absence #${id} not found`);
    await this.prisma.absence.delete({ where: { id } });
  }

  // ─── Mapper ───────────────────────────────────────────────────────────────

  private toSummary(a: AbsenceRow): AbsenceSummary {
    const meta = ABSENCE_META[a.type];
    return {
      id: a.id,
      employee_id: a.employee_id,
      employee_name: a.employee.full_name,
      type: a.type as unknown as import('@lumicore/shared-types').AbsenceType,
      code: meta.code,
      date_from: a.date_from.toISOString().slice(0, 10),
      date_to: a.date_to.toISOString().slice(0, 10),
      comment: a.comment,
      reduces_norm_hours: meta.reduces_norm,
      created_at: a.created_at.toISOString(),
    };
  }
}
