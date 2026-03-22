import { Module } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Module({
  providers: [
    StripeWebhookService,
    PrismaService,
    NotificationsService,
    NotificationsGateway,
  ],
  controllers: [StripeWebhookController],
})
export class StripeWebhookModule {}
