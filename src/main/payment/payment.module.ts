import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Module({
  providers: [
    PaymentService,
    PrismaService,
    NotificationsService,
    NotificationsGateway,
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
