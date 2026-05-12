import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsCron } from './notifications.cron';
import { ExpoPushService } from './expo-push.service';
import { TimeTrackingModule } from '../time-tracking/time-tracking.module';

@Module({
  imports: [TimeTrackingModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsCron, ExpoPushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
