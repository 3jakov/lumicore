import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { EmployeesModule } from './employees/employees.module';
import { TasksModule } from './tasks/tasks.module';
import { ToolsModule } from './tools/tools.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { SettingsModule } from './settings/settings.module';
import { DocAcknowledgementModule } from './doc-acknowledgement/doc-acknowledgement.module';
import { PhotosModule } from './photos/photos.module';
import { DocumentsModule } from './documents/documents.module';
import { AbsencesModule } from './absences/absences.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    ProjectsModule,
    EmployeesModule,
    TasksModule,
    ToolsModule,
    TimeTrackingModule,
    SettingsModule,
    DocAcknowledgementModule,
    PhotosModule,
    DocumentsModule,
    AbsencesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
