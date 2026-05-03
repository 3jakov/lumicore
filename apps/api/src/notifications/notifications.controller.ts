// Notifications module — in-app timer reminders
import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import type { NotificationSummary } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '@lumicore/shared-types';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/v1/notifications — my last 50 notifications */
  @Get()
  findMine(@CurrentUserDecorator() user: CurrentUser): Promise<NotificationSummary[]> {
    return this.notificationsService.findMine(user.id);
  }

  /** PATCH /api/v1/notifications/read-all — mark all as read */
  @Patch('read-all')
  @HttpCode(204)
  markAllRead(@CurrentUserDecorator() user: CurrentUser): Promise<void> {
    return this.notificationsService.markAllRead(user.id);
  }

  /** PATCH /api/v1/notifications/:id/read — mark single as read */
  @Patch(':id/read')
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<NotificationSummary> {
    return this.notificationsService.markRead(id, user.id);
  }
}
