/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async createCheckoutSession(userId: string, membershipId: string) {
    try {
      const plan = await this.prisma.membership.findUnique({
        where: { id: membershipId },
      });

      if (!plan) {
        throw new NotFoundException('Selected plan not found.');
      }

      if (plan.currentPrice <= 0) {
        return {
          url: `${process.env.FRONTEND_URL}/payment/success`,
        };
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: `${plan.tier} Membership`,
              },
              unit_amount: Math.round(plan.currentPrice * 100),
              recurring: {
                interval: 'year',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${this.configService.get('FRONTEND_URL')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
        client_reference_id: userId,
        metadata: {
          membershipId: plan.id,
        },
      });

      return { url: session.url };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Stripe Error: ${error.message}`);
    }
  }
}
