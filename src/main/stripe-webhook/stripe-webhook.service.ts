/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async handleWebhook(signature: string, payload: Buffer) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      this.logger.error(
        ` Webhook signature verification failed: ${err.message}`,
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
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
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

    if (!userId || !membershipId) {
      this.logger.error('Missing userId or membershipId in session metadata');
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const plan = await tx.membership.findUnique({
        where: { id: membershipId },
      });
      if (!plan)
        throw new Error('Membership plan not found during webhook processing');

      await tx.user.update({
        where: { id: userId },
        data: { membershipId: membershipId },
      });

      await tx.subscription.upsert({
        where: { stripeSubscriptionId: stripeSubId },
        update: {
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        create: {
          stripeSubscriptionId: stripeSubId,
          userId: userId,
          membershipId: membershipId,
          amountPaid: plan.currentPrice,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    });

    this.logger.log(
      `Membership & Subscription activated for User ID: ${userId}`,
    );
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const subId = subscription.id;

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subId },
      data: { status: 'canceled' },
    });

    this.logger.log(`Subscription ${subId} marked as canceled`);
  }
}
