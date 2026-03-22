import { Module } from '@nestjs/common';
import { CanineService } from './canine.service';
import { CanineController } from './canine.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Module({
  providers: [
    CanineService,
    PrismaService,
    CloudinaryService,
    NotificationsService,
    NotificationsGateway,
  ],
  controllers: [CanineController],
})
export class CanineModule {}
