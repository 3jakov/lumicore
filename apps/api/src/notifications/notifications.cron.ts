// Notifications cron — fires at 8:00 and 18:00 on Tallinn weekdays
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { TimeTrackingGateway } from '../time-tracking/time-tracking.gateway';
import { getTallinToday, tallinDayStart, tallinDayEnd } from '../common/tallinn-date';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsCron {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: TimeTrackingGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── 8:00 weekdays — forgot to start ──────────────────────────────────────

  @Cron('0 8 * * 1-5', { timeZone: 'Europe/Tallinn' })
  async checkMorning(): Promise<void> {
    const today = getTallinToday();
    const dayStart = tallinDayStart(today);
    const dayEnd = tallinDayEnd(today);

    const employees = await this.prisma.employee.findMany({
      where: { archived_at: null, status: 'Aktiivne' },
      select: { id: true },
    });

    for (const emp of employees) {
      const hasAbsence = await this.prisma.absence.count({
        where: {
          employee_id: emp.id,
          date_from: { lte: new Date(today) },
          date_to: { gte: new Date(today) },
        },
      });
      if (hasAbsence) continue;

      const hasEntry = await this.prisma.timeEntry.count({
        where: {
          employee_id: emp.id,
          started_at: { gte: dayStart, lte: dayEnd },
        },
      });
      if (hasEntry) continue;

      const n = await this.prisma.notification.create({
        data: { employee_id: emp.id, type: 'TimerForgottenStart' },
      });
      this.gateway.emitToEmployee(emp.id, 'notification:new', this.notificationsService.toSummary(n));
    }
  }

  // ─── 18:00 weekdays — forgot to stop ──────────────────────────────────────

  @Cron('0 18 * * 1-5', { timeZone: 'Europe/Tallinn' })
  async checkEvening(): Promise<void> {
    const running = await this.prisma.timeEntry.findMany({
      where: { ended_at: null },
      select: { employee_id: true },
      distinct: ['employee_id'],
    });

    for (const { employee_id } of running) {
      const n = await this.prisma.notification.create({
        data: { employee_id, type: 'TimerForgottenStop' },
      });
      this.gateway.emitToEmployee(employee_id, 'notification:new', this.notificationsService.toSummary(n));
    }
  }
}
