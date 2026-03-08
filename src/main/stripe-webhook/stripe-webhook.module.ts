import { Module } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [StripeWebhookService, PrismaService],
  controllers: [StripeWebhookController],
})
export class StripeWebhookModule {}
