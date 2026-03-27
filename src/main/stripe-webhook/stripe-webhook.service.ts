/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { NotificationsService } from 'src/notifications/notifications.service';
import {
  CanineStatus,
  ServiceType,
  SubscriptionStatus,
} from 'generated/prisma/enums';
import { LitterService } from '../litter/litter.service';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly litterService: LitterService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async handleWebhook(signature: string, payload: Buffer) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.configService.get('STRIPE_WEBHOOK_SECRET')!,
      );
    } catch (err: any) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSession(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'checkout.session.expired':
        case 'payment_intent.payment_failed':
          await this.handleFailedPayment(event.data.object as any);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionStatusUpdate(
            (event.data.object as Stripe.Subscription).id,
            SubscriptionStatus.CANCELED,
          );
          break;

        case 'invoice.payment_failed':
          await this.handleSubscriptionStatusUpdate(
            (event.data.object as any).subscription as string,
            SubscriptionStatus.UNPAID,
          );
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing webhook event: ${error.message}`);
      throw new InternalServerErrorException('Webhook processing failed');
    }

    return { received: true };
  }

  private async handleCheckoutSession(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id;
    const metadata = session.metadata;

    if (!userId) return;

    // 1. Extra Canine Registration Logic
    if (metadata?.type === 'EXTRA_CANINE_REGISTRATION') {
      await this.handleExtraCaninePayment(session);
      return;
    }

    // 2. Litter Registration Logic
    if (metadata?.type === 'LITTER_REGISTRATION') {
      await this.handleLitterPayment(session);
      return;
    }

    // 3. Subscription/Membership Logic
    const membershipId = metadata?.membershipId;
    const stripeSubId = session.subscription as string;

    if (!membershipId || !stripeSubId) return;

    const subscription: any =
      await this.stripe.subscriptions.retrieve(stripeSubId);
    const periodEnd = new Date(subscription.current_period_end * 1000);

    await this.prisma.$transaction(async (tx) => {
      const plan = await tx.membership.findUnique({
        where: { id: membershipId },
      });
      if (!plan) throw new Error('Plan not found');

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      let updateData: any = { membershipId: membershipId };

      if (plan.tier === 'PRESTIGE' && user.pcrPrefix !== 'PA') {
        const newPrefix = 'PA';
        updateData.pcrPrefix = newPrefix;
        updateData.pcrId = `PCR-${newPrefix}${user.pcrIncremental}-${user.pcrRandom}`;
      }

      await tx.user.update({ where: { id: userId }, data: updateData });

      await tx.subscription.upsert({
        where: { stripeSubscriptionId: stripeSubId },
        update: {
          status: SubscriptionStatus.PAID,
          currentPeriodEnd: periodEnd,
        },
        create: {
          stripeSubscriptionId: stripeSubId,
          userId: userId,
          membershipId: membershipId,
          amountPaid: plan.currentPrice,
          status: SubscriptionStatus.PAID,
          currentPeriodEnd: periodEnd,
        },
      });
    });
  }

  private async handleExtraCaninePayment(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id;
    const meta = session.metadata;

    if (!userId || !meta?.canineData) {
      this.logger.error('Missing metadata for Extra Canine Registration');
      return;
    }

    try {
      // 1. Parse all split metadata keys
      const basic = JSON.parse(meta.canineData);
      const location = JSON.parse(meta.locationData || '{}');
      const health = JSON.parse(meta.healthData || '{}');
      const imageUrls: string[] = JSON.parse(meta.imageUrls || '[]');
      const docUrls: string[] = JSON.parse(meta.docUrls || '[]');

      // 2. Reconstruct canineDto to match Database Schema
      const canineDto = {
        name: basic.name,
        breedId: basic.breedId,
        gender: basic.gender,
        dateOfBirth: new Date(basic.dob), // String theke Date object
        color: basic.color,
        weight: basic.weight,
        microchipId: basic.microchip,
        city: location.city,
        state: location.state,
        country: location.country,
        zipCode: location.zip,
        healthStatus: health.status,
        primaryBreedDNA: health.pDNA,
        secondaryBreedDNA: health.sDNA,
        vaccinations: health.vacs,
        healthClearances: health.clear,
      };

      await this.prisma.$transaction(async (tx) => {
        // 3. Fetch Breed for PCR ID Logic
        const breed = await tx.breed.findUnique({
          where: { id: canineDto.breedId },
        });

        if (!breed)
          throw new Error(`Breed not found for ID: ${canineDto.breedId}`);

        const pcrPrefix = breed.type === 'DESIGNER' ? 'G' : 'B';
        const lastCanine = await tx.canine.findFirst({
          where: {
            pcrPrefix,
            pcrBreedCode: breed.breedCode,
          },
          orderBy: { pcrIncremental: 'desc' },
        });

        const nextInc = lastCanine
          ? parseInt(lastCanine.pcrIncremental) + 1
          : 1;
        const pcrIncremental = nextInc.toString().padStart(5, '0');
        const pcrRandom = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();
        const pcrId = `PCR-${pcrPrefix}${breed.breedCode}-${pcrIncremental}-${pcrRandom}`;

        // 4. Create the Canine Record
        const newCanine = await tx.canine.create({
          data: {
            ...canineDto, // Reconstructed object
            pcrId,
            pcrPrefix,
            pcrBreedCode: breed.breedCode,
            pcrIncremental,
            pcrRandom,
            ownerId: userId,
            status: CanineStatus.PENDING,
            tier: pcrPrefix === 'G' ? 'GOLD' : 'BLUE',
            images: {
              create: imageUrls.map((url) => ({
                url,
                publicId:
                  url.split('/').pop()?.split('.')[0] || `img-${Date.now()}`,
              })),
            },
            DNAdocuments: {
              create: docUrls.map((url) => ({
                url,
                name: 'Canine DNA Report',
                publicId:
                  url.split('/').pop()?.split('.')[0] || `doc-${Date.now()}`,
              })),
            },
          },
        });

        await tx.transaction.create({
          data: {
            stripeSessionId: session.id,
            userId: userId,
            serviceType: ServiceType.CANINE_REG, // ServiceType enum theke
            amount: session.amount_total ? session.amount_total / 100 : 0,
            status: SubscriptionStatus.PAID,
            resourceId: newCanine.id, // Newly created canine er ID
          },
        });
      });

      this.logger.log(
        `Successfully registered extra canine for user ${userId}`,
      );
    } catch (error: any) {
      this.logger.error(`Webhook Extra Canine Error: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  private async handleFailedPayment(session: any) {
    // Session metadata theke canineId khuje ber kora (Stripe object structure onujayi)
    const metadata =
      session.metadata || session.last_payment_error?.payment_method?.metadata;
    const canineId = metadata?.canineId;

    if (canineId && metadata?.type === 'EXTRA_CANINE_REGISTRATION') {
      try {
        const canine = await this.prisma.canine.findUnique({
          where: { id: canineId },
        });
        // Shudhu PENDING_PAYMENT holei delete korbo jate active data delete na hoy
        if (canine && canine.status === 'PENDING_PAYMENT') {
          await this.prisma.canine.delete({ where: { id: canineId } });
          this.logger.warn(
            `Abandoned canine record ${canineId} deleted due to failed payment.`,
          );
        }
      } catch (err: any) {
        this.logger.error(
          `Cleanup failed for canine ${canineId}: ${err.message}`,
        );
      }
    }
  }

  private async handleLitterPayment(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id!;
    const dto = JSON.parse(session.metadata!.litterData);
    const imageUrls = JSON.parse(session.metadata!.imageUrls);
    const docUrls = JSON.parse(session.metadata!.docUrls);

    await this.prisma.$transaction(async (tx) => {
      const breed = await tx.breed.findUnique({ where: { id: dto.breedId } });
      if (!breed) throw new Error(`Breed not found: ${dto.breedId}`);

      await this.litterService.executeLitterCreation(
        tx,
        userId,
        dto,
        imageUrls,
        docUrls,
        breed,
      );
    });
  }

  private async handleSubscriptionStatusUpdate(
    subId: string,
    status: SubscriptionStatus,
  ) {
    if (!subId) return;
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subId },
      data: { status: status },
    });
  }
}
