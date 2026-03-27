import { Module } from '@nestjs/common';
import { LitterService } from './litter.service';
import { LitterController } from './litter.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { PaymentService } from '../payment/payment.service';

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
