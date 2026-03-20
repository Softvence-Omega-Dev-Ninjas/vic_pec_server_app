import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  providers: [NotificationsService, PrismaService, NotificationsGateway],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
