/* eslint-disable @typescript-eslint/no-unsafe-call */
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
import {
  // CanineStatus,
  // ServiceType,
  SubscriptionStatus,
} from 'generated/prisma/enums';

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
          url: `${this.configService.get('FRONTEND_URL')}/owner/dashboard?success=true`,
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
        success_url: `${this.configService.get('FRONTEND_URL')}/owner/dashboard?success=true&type=regitration`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/owner/dashboard?success=false&type=regitration`,
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

    // 1. Dui table thekei data fetch korchi (Subscriptions + One-time Transactions)
    const [subscriptions, transactions, subCount, transCount] =
      await Promise.all([
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
                profileImage: { select: { url: true } },
              },
            },
            membership: { select: { name: true, tier: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.transaction.findMany({
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
                profileImage: { select: { url: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.subscription.count(),
        this.prisma.transaction.count(),
      ]);

    // 2. Subscription Data Format kora
    const formattedSubs = subscriptions.map((sub) => ({
      transactionId: sub.id,
      externalId: sub.stripeSubscriptionId,
      amount: sub.amountPaid,
      status: sub.status,
      category: 'MEMBERSHIP',
      description: `${sub.membership?.name} Plan Subscription`,
      date: sub.createdAt,
      billingDetails: this.formatBilling(sub.user),
      canRefund: sub.status === 'PAID',
    }));

    // 3. One-time Transaction Data Format kora
    const formattedTrans = transactions.map((trans) => ({
      transactionId: trans.id,
      externalId: trans.stripeSessionId,
      amount: trans.amount,
      status: trans.status, // e.g., COMPLETED, FAILED
      category: trans.serviceType, // CANINE_REG, LITTER_REG, etc.
      description: this.getServiceDescription(trans.serviceType),
      date: trans.createdAt,
      billingDetails: this.formatBilling(trans.user),
      canRefund: trans.status === SubscriptionStatus.PAID,
    }));

    // 4. Combined and Sorted Result
    const allPayments = [...formattedSubs, ...formattedTrans]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, Number(limit)); // Limit onujayi slice kora

    const total = subCount + transCount;

    return {
      payments: allPayments,
      pagination: {
        totalItems: total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        hasNextPage: skip + Number(limit) < total,
      },
    };
  }

  // Helper: Billing Info formatting
  private formatBilling(user: any) {
    return {
      name: user?.fullName,
      email: user?.email,
      phone: user?.phoneNumber || 'N/A',
      location: user?.city || '',
      pcrId: user?.pcrId,
      avatar: user?.profileImage?.url || null,
    };
  }

  // Helper: Description logic
  private getServiceDescription(type: string) {
    switch (type) {
      case 'CANINE_REG':
        return 'Extra Canine Registration';
      case 'LITTER_REG':
        return 'Litter Registration Fee';
      case 'TRANSFER':
        return 'Ownership Transfer Fee';
      case 'CERTIFICATE':
        return 'Certificate Request Fee';
      default:
        return 'Service Payment';
    }
  }

  async getRevenueStats(dto: RevenueFilterDto) {
    const targetYear = Number(dto.year) || new Date().getFullYear();
    const targetMonth = Number(dto.month) || new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1);

    // 1. Daily Breakdown (Combining Subscription and Transaction tables)
    const dailyStats: any[] = await this.prisma.$queryRaw`
    WITH combined_payments AS (
      -- Subscriptions (Membership)
      SELECT "createdAt", "amountPaid" as amount, "userId", 'MEMBERSHIP' as type
      FROM "subscriptions"
      WHERE "status" = 'active' AND "createdAt" >= ${startDate} AND "createdAt" < ${endDate}
      
      UNION ALL
      
      -- One-time Transactions (Services like Canine/Litter etc)
      SELECT "createdAt", "amount", "userId", "serviceType"::text as type
      FROM "transactions"
      WHERE "status" = 'PAID' AND "createdAt" >= ${startDate} AND "createdAt" < ${endDate}
    )
    SELECT 
      TO_CHAR(day, 'DD Mon') as label,
      COALESCE(SUM(cp.amount), 0)::FLOAT as revenue, -- Total Revenue
      
      -- Specific Membership Revenue
      COALESCE(SUM(CASE WHEN cp.type = 'MEMBERSHIP' THEN cp.amount ELSE 0 END), 0)::FLOAT as "membershipRevenue",
      
      -- Specific Service Revenue (Jodi Canine/Litter alada dorkar hoy)
      COALESCE(SUM(CASE WHEN cp.type = 'CANINE_REG' THEN cp.amount ELSE 0 END), 0)::FLOAT as "canineregRevenue",
      COALESCE(SUM(CASE WHEN cp.type = 'LITTER_REG' THEN cp.amount ELSE 0 END), 0)::FLOAT as "litterregRevenue",
      
      COUNT(cp.amount)::INT as sales_count,
      COUNT(DISTINCT cp."userId")::INT as unique_customers
    FROM (
      SELECT generate_series(
        DATE_TRUNC('month', MAKE_DATE(${targetYear}, ${targetMonth}, 1)),
        DATE_TRUNC('month', MAKE_DATE(${targetYear}, ${targetMonth}, 1)) + INTERVAL '1 month' - INTERVAL '1 day',
        INTERVAL '1 day'
      )::date as day
    ) d
    LEFT JOIN combined_payments cp ON DATE_TRUNC('day', cp."createdAt") = d.day 
    GROUP BY d.day
    ORDER BY d.day ASC
`;

    // 2. Fetch Summary from both tables
    const [subSummary, transSummary] = await Promise.all([
      this.prisma.subscription.aggregate({
        where: { status: 'PAID', createdAt: { gte: startDate, lt: endDate } },
        _sum: { amountPaid: true },
        _count: { id: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          status: SubscriptionStatus.PAID,
          createdAt: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalRev =
      (subSummary._sum.amountPaid || 0) + (transSummary._sum.amount || 0);
    const totalCount =
      (subSummary._count.id || 0) + (transSummary._count.id || 0);
    const avgOrder =
      totalCount > 0 ? (totalRev / totalCount).toFixed(2) : '0.00';

    // 3. Category Breakdown (Optional: Detailed view)
    const serviceBreakdown = await this.prisma.transaction.groupBy({
      by: ['serviceType'],
      where: {
        status: SubscriptionStatus.PAID,
        createdAt: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      graphData: dailyStats,
      summary: {
        totalRevenue: totalRev,
        totalTransactions: totalCount,
        averageOrderValue: avgOrder,
      },
      breakdown: [
        {
          type: 'MEMBERSHIP',
          amount: subSummary._sum.amountPaid || 0,
          count: subSummary._count.id,
        },
        ...serviceBreakdown.map((item) => ({
          type: item.serviceType,
          amount: item._sum.amount || 0,
          count: item._count.id,
        })),
      ],
    };
  }

  // PaymentService-e add korun
  async createExtraCanineSession(
    userId: string,
    canineDto: any,
    imageUrls: string[],
    docUrls: string[],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { membership: { include: { servicePricings: true } } },
    });

    if (!user?.membership)
      throw new BadRequestException('Active membership required');

    const canineService = user.membership.servicePricings.find(
      (sp) => sp.serviceType === 'CANINE_REG',
    );
    const finalPrice = Math.max(
      0,
      (canineService?.price || 0) - (user.membership.canineRegDiscount || 0),
    );

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: userId,
      metadata: {
        type: 'EXTRA_CANINE_REGISTRATION',
        canineData: JSON.stringify({
          name: canineDto.name,
          breedId: canineDto.breedId,
          gender: canineDto.gender,
          dob: canineDto.dateOfBirth,
          color: canineDto.color,
          weight: Number(canineDto.weight),
          microchip: canineDto.microchipId,
        }),
        locationData: JSON.stringify({
          city: canineDto.city,
          state: canineDto.state,
          country: canineDto.country,
          zip: canineDto.zipCode,
        }),
        healthData: JSON.stringify({
          status: canineDto.healthStatus,
          pDNA: canineDto.primaryBreedDNA,
          sDNA: canineDto.secondaryBreedDNA,
          vacs: canineDto.vaccinations || [],
          clear: canineDto.healthClearances || [],
        }),
        imageUrls: JSON.stringify(imageUrls),
        docUrls: JSON.stringify(docUrls),
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Extra Canine Registration: ${canineDto.name}`,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/owner/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/owner/dashboard?success=false`,
    });

    return { url: session.url };
  }

  async createLitterSession(
    userId: string,
    dto: any,
    generation: string,
    imageUrls: string[],
    docUrls: string[],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { membership: { include: { servicePricings: true } } },
    });

    const pricing = user?.membership?.servicePricings.find(
      (sp) => sp.serviceType === 'LITTER_REG',
    );

    const basePrice = pricing?.price || 0;
    const discount = user?.membership?.litterRegDiscount || 0;
    const finalPrice = Math.max(0, basePrice * (1 - discount));
    const unitAmount = Math.round(finalPrice * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: userId,
      metadata: {
        type: 'LITTER_REGISTRATION',
        // Basic info minified
        b: JSON.stringify({
          n: dto.litterName,
          bid: dto.breedId,
          dob: dto.dateOfBirth,
          mid: dto.motherPcrId,
          fid: dto.fatherPcrId,
          gen: generation,
        }),
        // Location info minified
        l: JSON.stringify({
          c: dto.city,
          s: dto.state,
          z: dto.zipCode,
          co: dto.country,
        }),
        // Puppies array minified (n=name, g=gender, c=color, w=weight, m=microchip)
        p: JSON.stringify(
          dto.puppies?.map((pup: any) => ({
            n: pup.name,
            g: pup.gender,
            c: pup.color,
            w: pup.weight,
            m: pup.microchipId,
            hs: pup.healthStatus || 'EXCELLENT', // hs = healthStatus
            v: pup.vaccinations || [], // v = vaccinations
            hc: pup.healthClearances || [],
          })),
        ),
        imgs: JSON.stringify(imageUrls),
        docs: JSON.stringify(docUrls),
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Litter Registration: ${dto.litterName}` },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get('FRONTEND_URL')}/owner/dashboard?success=true`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/owner/dashboard?success=false`,
    });

    return { url: session.url };
  }
}
