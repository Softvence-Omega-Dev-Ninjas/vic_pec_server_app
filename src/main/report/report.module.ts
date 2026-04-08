import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

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
