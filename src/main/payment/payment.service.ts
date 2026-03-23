/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger, // 1. Added Logger
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaginationDto, RevenueFilterDto } from './dto/PaginationDto';
import { SubscriptionStatus } from 'generated/prisma/enums';

export const PLAN_ORDER = {
  FOUNDATIONAL: 1,
  REGISTRY: 2,
  PRESTIGE: 3,
};

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name); // 2. Initialized Logger

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  // 3. Implemented missing method
  private async activateFoundationalPlan(userId: string, membershipId: string) {
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { membershipId },
      });

      await tx.subscription.create({
        data: {
          userId,
          membershipId,
          amountPaid: 0,
          status: SubscriptionStatus.PAID,
          currentPeriodEnd: oneYearLater,
          stripeSubscriptionId: `free_${Date.now()}_${userId.slice(-5)}`,
        },
      });
    });

    this.logger.log(`Foundational plan activated for user: ${userId}`);
  }

  async createCheckoutSession(userId: string, membershipId: string) {
    try {
      const [requestedPlan, user] = await Promise.all([
        this.prisma.membership.findUnique({ where: { id: membershipId } }),
        this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            membership: true,
            subscriptions: {
              where: { status: 'PAID' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
      ]);

      if (!requestedPlan)
        throw new NotFoundException('Selected plan not found.');
      if (!user) throw new NotFoundException('User not found.');

      const currentSub = user.subscriptions[0];
      const currentTier =
        (user.membership?.tier as keyof typeof PLAN_ORDER) || 'FOUNDATIONAL';

      if (currentSub && currentSub.currentPeriodEnd > new Date()) {
        if (PLAN_ORDER[requestedPlan.tier] <= PLAN_ORDER[currentTier]) {
          throw new BadRequestException(
            `You already have an active ${currentTier} plan. You can only upgrade to a higher tier.`,
          );
        }

        // Fixed typo: this.loggeg -> this.logger
        this.logger.log(
          `User ${userId} is upgrading from ${currentTier} to ${requestedPlan.tier}`,
        );
      }

      if (requestedPlan.currentPrice <= 0) {
        await this.activateFoundationalPlan(userId, requestedPlan.id);
        return {
          url: `${this.configService.get('FRONTEND_URL')}/payment/success`,
        };
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: requestedPlan.name,
                description: `${requestedPlan.tier} Membership`,
              },
              unit_amount: Math.round(requestedPlan.currentPrice * 100),
              recurring: { interval: 'year' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${this.configService.get('FRONTEND_URL')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
        client_reference_id: userId,
        metadata: { membershipId: requestedPlan.id },
      });

      return { url: session.url };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(`Stripe Error: ${error.message}`);
    }
  }

  async getAllPayments(dto: PaginationDto) {
    const { page = 1, limit = 10 } = dto;
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              pcrId: true,
              phoneNumber: true,
              city: true,
              country: true,
              status: true,
              profileImage: { select: { url: true } },
            },
          },
          membership: {
            select: {
              id: true,
              name: true,
              tier: true,
              canineLimit: true,
              currentPrice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count(),
    ]);

    const formattedData = data.map((sub) => ({
      ...sub,
      user: {
        ...sub.user,
        profileImageUrl: (sub.user as any).profileImage?.url || null,
      },
    }));

    return {
      data: formattedData,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getRevenueStats(dto: RevenueFilterDto) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const targetYear = Number(dto.year) || currentYear;
    const targetMonth = Number(dto.month) || currentMonth;

    const stats = await this.prisma.$queryRaw`
    SELECT 
      TO_CHAR(day, 'DD Mon') as label,
      COALESCE(SUM(s."amountPaid"), 0)::FLOAT as revenue, -- Explicitly cast to FLOAT
      COUNT(s.id)::INT as total_sales                -- Explicitly cast to INT
    FROM (
      SELECT generate_series(
        DATE_TRUNC('month', MAKE_DATE(${targetYear}, ${targetMonth}, 1)),
        DATE_TRUNC('month', MAKE_DATE(${targetYear}, ${targetMonth}, 1)) + INTERVAL '1 month' - INTERVAL '1 day',
        INTERVAL '1 day'
      )::date as day
    ) d
    LEFT JOIN subscriptions s ON DATE_TRUNC('day', s."createdAt") = d.day 
      AND s."status" = 'PAID'
    GROUP BY d.day
    ORDER BY d.day ASC
  `;

    return stats;
  }
}
