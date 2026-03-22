import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Module({
  providers: [
    ReportService,
    PrismaService,
    NotificationsService,
    NotificationsGateway,
  ],
  controllers: [ReportController],
})
export class ReportModule {}
