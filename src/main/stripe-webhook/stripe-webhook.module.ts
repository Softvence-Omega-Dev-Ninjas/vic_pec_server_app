import { Module } from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaService } from '../prisma/prisma.service';

import { LitterService } from '../litter/litter.service';

import { PaymentService } from '../payment/payment.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CertificateRequestService } from '../admin/certificate-request/certificate-request.service';

@Module({
  providers: [
    StripeWebhookService,
    PrismaService,
    NotificationsService,
    NotificationsGateway,
    LitterService,
    CloudinaryService,
    PaymentService,
    CertificateRequestService,
  ],
  controllers: [StripeWebhookController],
})
export class StripeWebhookModule {}
