import { Module } from '@nestjs/common';
import { CanineService } from './canine.service';
import { CanineController } from './canine.controller';
import { PrismaService } from '../prisma/prisma.service';

import { PaymentService } from '../payment/payment.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

@Module({
  providers: [
    CanineService,
    PrismaService,
    CloudinaryService,
    NotificationsService,
    NotificationsGateway,
    PaymentService,
  ],
  controllers: [CanineController],
})
export class CanineModule {}
