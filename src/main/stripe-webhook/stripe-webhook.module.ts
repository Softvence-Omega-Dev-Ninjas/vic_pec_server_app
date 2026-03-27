import { Module } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { LitterService } from '../litter/litter.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PaymentService } from '../payment/payment.service';

@Module({
  providers: [
    StripeWebhookService,
    PrismaService,
    NotificationsService,
    NotificationsGateway,
    LitterService,
    CloudinaryService,
    PaymentService,
  ],
  controllers: [StripeWebhookController],
})
export class StripeWebhookModule {}
