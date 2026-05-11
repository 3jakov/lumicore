// Notifications module — in-app timer reminders
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { NotificationSummary } from '@lumicore/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import type { CurrentUser } from '@lumicore/shared-types';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

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

  // ─── Device tokens ─────────────────────────────────────────────────────────

  /** POST /api/v1/notifications/device-token — register Expo push token */
  @Post('device-token')
  @HttpCode(204)
  registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<void> {
    return this.notificationsService.upsertDeviceToken(user.id, dto.token);
  }

  /** DELETE /api/v1/notifications/device-token — unregister on logout */
  @Delete('device-token')
  @HttpCode(204)
  removeDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @CurrentUserDecorator() user: CurrentUser,
  ): Promise<void> {
    void user; // token is globally unique — no need to scope by employee
    return this.notificationsService.removeDeviceToken(dto.token);
  }
}
