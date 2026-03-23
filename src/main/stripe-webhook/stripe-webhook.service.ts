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
import { SubscriptionStatus } from 'generated/prisma/enums';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly notificationsService: NotificationsService,
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
    const membershipId = session.metadata?.membershipId;
    const stripeSubId = session.subscription as string;

    if (!userId || !membershipId || !stripeSubId) return;

    const subscription: any =
      await this.stripe.subscriptions.retrieve(stripeSubId);
    const periodEnd = new Date(subscription.current_period_end * 1000);

    await this.prisma.$transaction(async (tx) => {
      const plan = await tx.membership.findUnique({
        where: { id: membershipId },
      });
      if (!plan) throw new Error('Plan not found');

      const user = await tx.user.findUnique({ where: { id: userId } });

      // Update User and PCR ID logic
      let updateData: any = { membershipId: membershipId };

      if (!user) {
        throw new Error('User not found');
      }

      // logic: If plan is PRESTIGE, change prefix to PA and regenerate pcrId
      if (plan.tier === 'PRESTIGE' && user.pcrPrefix !== 'PA') {
        const newPrefix = 'PA';
        const newPcrId = `PCR-${newPrefix}${user.pcrIncremental}-${user.pcrRandom}`;
        updateData.pcrPrefix = newPrefix;
        updateData.pcrId = newPcrId;
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Upsert subscription
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

    this.logger.log(
      `Subscription activated and PCR Prefix updated for User: ${userId}`,
    );
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

    this.logger.log(`Subscription ${subId} status updated to ${status}`);
  }
}
