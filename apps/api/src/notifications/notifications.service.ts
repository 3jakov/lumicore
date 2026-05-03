// Notifications module — in-app timer reminders
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationSummary } from '@lumicore/shared-types';
import { NotificationType } from '@lumicore/shared-types';
import { PrismaService } from '../database/prisma.service';
import type { Notification } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(employeeId: number): Promise<NotificationSummary[]> {
    const rows = await this.prisma.notification.findMany({
      where: { employee_id: employeeId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    return rows.map(this.toSummary);
  }

  async markRead(id: number, employeeId: number): Promise<NotificationSummary> {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException(`Notification #${id} not found`);
    if (n.employee_id !== employeeId) throw new ForbiddenException();

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { read_at: new Date() },
    });
    return this.toSummary(updated);
  }

  async markAllRead(employeeId: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { employee_id: employeeId, read_at: null },
      data: { read_at: new Date() },
    });
  }

  toSummary(n: Notification): NotificationSummary {
    return {
      id: n.id,
      type: n.type as unknown as NotificationType,
      read_at: n.read_at?.toISOString() ?? null,
      created_at: n.created_at.toISOString(),
    };
  }
}
