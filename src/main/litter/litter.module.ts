import { Module } from '@nestjs/common';
import { LitterService } from './litter.service';
import { LitterController } from './litter.controller';
import { PrismaService } from '../prisma/prisma.service';

import { PaymentService } from '../payment/payment.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

@Module({
  providers: [
    LitterService,
    PrismaService,
    CloudinaryService,
    NotificationsService,
    NotificationsGateway,
    PaymentService,
  ],
  controllers: [LitterController],
  exports: [LitterService],
})
export class LitterModule {}
