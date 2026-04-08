import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../main/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { AdminStatsController } from './stats/admin-stats.controller';
import { AdminStatsService } from './stats/admin-stats.service';

@Module({
  providers: [
    NotificationsService,
    PrismaService,
    NotificationsGateway,
    AdminStatsService,
  ],
  controllers: [NotificationsController, AdminStatsController],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
