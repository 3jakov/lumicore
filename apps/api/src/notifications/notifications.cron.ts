// Notifications cron — fires at 8:00 and 18:00 on Tallinn weekdays
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { TimeTrackingGateway } from '../time-tracking/time-tracking.gateway';
import { getTallinnToday, tallinnDayStart, tallinnDayEnd } from '../common/tallinn-date';
import { NotificationsService } from './notifications.service';
import { ExpoPushService } from './expo-push.service';

@Injectable()
export class NotificationsCron {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: TimeTrackingGateway,
    private readonly notificationsService: NotificationsService,
    private readonly expoPush: ExpoPushService,
  ) {}

  // ─── 8:00 weekdays — forgot to start ──────────────────────────────────────

  @Cron('0 8 * * 1-5', { timeZone: 'Europe/Tallinn' })
  async checkMorning(): Promise<void> {
    const today = getTallinnToday();
    const dayStart = tallinnDayStart(today);
    const dayEnd = tallinnDayEnd(today);

    const employees = await this.prisma.employee.findMany({
      where: { archived_at: null, status: 'Aktiivne' },
      select: { id: true },
    });

    for (const emp of employees) {
      // Skip if already notified today (e.g. cron restarted / manual trigger)
      const alreadyNotified = await this.prisma.notification.count({
        where: {
          employee_id: emp.id,
          type: 'TimerForgottenStart',
          created_at: { gte: dayStart, lte: dayEnd },
        },
      });
      if (alreadyNotified) continue;

      // Skip if employee has an absence covering today
      const hasAbsence = await this.prisma.absence.count({
        where: {
          employee_id: emp.id,
          date_from: { lte: new Date(today) },
          date_to: { gte: new Date(today) },
        },
      });
      if (hasAbsence) continue;

      // Skip if employee already has a time entry today
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

      // Push notification to all registered devices
      const tokens = await this.notificationsService.getTokensForEmployee(emp.id);
      await this.expoPush.sendToTokens(tokens, {
        title: 'Lumicore',
        body: 'Вы не забыли запустить таймер?',
        sound: 'default',
        data: { type: 'TimerForgottenStart' },
      });
    }
  }

  // ─── 18:00 weekdays — forgot to stop ──────────────────────────────────────

  @Cron('0 18 * * 1-5', { timeZone: 'Europe/Tallinn' })
  async checkEvening(): Promise<void> {
    const today = getTallinnToday();
    const dayStart = tallinnDayStart(today);
    const dayEnd = tallinnDayEnd(today);

    // Only consider timers started today — stale timers from previous days are
    // excluded entirely and will not trigger notifications.
    const running = await this.prisma.timeEntry.findMany({
      where: { ended_at: null, started_at: { gte: dayStart, lte: dayEnd } },
      select: { employee_id: true },
      distinct: ['employee_id'],
    });

    for (const { employee_id } of running) {
      // Skip if already notified today
      const alreadyNotified = await this.prisma.notification.count({
        where: {
          employee_id,
          type: 'TimerForgottenStop',
          created_at: { gte: dayStart, lte: dayEnd },
        },
      });
      if (alreadyNotified) continue;

      const n = await this.prisma.notification.create({
        data: { employee_id, type: 'TimerForgottenStop' },
      });
      this.gateway.emitToEmployee(employee_id, 'notification:new', this.notificationsService.toSummary(n));

      // Push notification to all registered devices
      const tokens = await this.notificationsService.getTokensForEmployee(employee_id);
      await this.expoPush.sendToTokens(tokens, {
        title: 'Lumicore',
        body: 'Таймер всё ещё запущен. Не забудьте остановить!',
        sound: 'default',
        data: { type: 'TimerForgottenStop' },
      });
    }
  }
}
