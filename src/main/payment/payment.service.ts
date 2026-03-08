/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async createCheckoutSession(userId: string, membershipId: string) {
    try {
      // ক) মেম্বারশিপ প্ল্যান চেক করা
      const plan = await this.prisma.membership.findUnique({
        where: { id: membershipId },
      });

      if (!plan || !plan.stripePriceId) {
        throw new NotFoundException(
          'Selected plan is not available for purchase.',
        );
      }

      // খ) স্ট্রাইপ চেকআউট সেশন তৈরি
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
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
