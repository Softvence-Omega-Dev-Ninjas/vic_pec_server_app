/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from './dto/create-membership-plan.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ServiceType,
  SubscriptionStatus,
} from '../../../../generated/prisma/enums';

@Injectable()
export class MembershipPlanService {
  private readonly logger = new Logger(MembershipPlanService.name);
  private readonly MAX_PLANS = 3;

  constructor(private prisma: PrismaService) {}

  async createPlan(dto: CreateMembershipDto) {
    try {
      const planCount = await this.prisma.membership.count();
      if (planCount >= this.MAX_PLANS) {
        throw new BadRequestException(
          `Maximum limit of ${this.MAX_PLANS} membership plans reached.`,
        );
      }

      const existing = await this.prisma.membership.findUnique({
        where: { tier: dto.tier },
      });
      if (existing)
        throw new ConflictException('This membership tier already exists.');

      return await this.prisma.$transaction(async (tx) => {
        // 1. Create Membership with Discounts
        const membership = await tx.membership.create({
          data: {
            tier: dto.tier,
            name: dto.name,
            currentPrice: dto.currentPrice,
            canineLimit: dto.canineLimit,
            features: dto.features,
            canineRegDiscount: dto.canineRegDiscount,
            litterRegDiscount: dto.litterRegDiscount,
            transferDiscount: dto.transferDiscount,
            certificateDiscount: dto.certificateDiscount,
          },
        });

        // 2. Create Service Specific Base Prices
        const pricingData = [
          { serviceType: ServiceType.CANINE_REG, price: dto.canineRegPrice },
          { serviceType: ServiceType.LITTER_REG, price: dto.litterRegPrice },
          { serviceType: ServiceType.TRANSFER, price: dto.transferPrice },
          { serviceType: ServiceType.CERTIFICATE, price: dto.certificatePrice },
        ];

        await tx.servicePricing.createMany({
          data: pricingData.map((p) => ({
            membershipId: membership.id,
            serviceType: p.serviceType,
            price: p.price,
          })),
        });

        return membership;
      });
    } catch (error: any) {
      this.logger.error(`Plan Creation Failed: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException(
        'Failed to create membership plan',
      );
    }
  }

  async getAllPlans() {
    try {
      return await this.prisma.membership.findMany({
        include: { servicePricings: true },
        orderBy: { currentPrice: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Fetch Failed: ${error}`);
      console.log(error);
      throw new InternalServerErrorException(
        'Could not fetch membership plans',
      );
    }
  }

  async updatePlan(id: string, dto: UpdateMembershipDto) {
    try {
      const plan = await this.prisma.membership.findUnique({ where: { id } });
      if (!plan) throw new NotFoundException('Membership plan not found');

      return await this.prisma.$transaction(async (tx) => {
        // 1. Update Membership table fields
        const updatedMembership = await tx.membership.update({
          where: { id },
          data: {
            name: dto.name,
            currentPrice: dto.currentPrice,
            canineLimit: dto.canineLimit,
            features: dto.features,
            canineRegDiscount: dto.canineRegDiscount,
            litterRegDiscount: dto.litterRegDiscount,
            transferDiscount: dto.transferDiscount,
            certificateDiscount: dto.certificateDiscount,
          },
        });

        // 2. Map service pricing fields to loop for cleaner code
        const servicePriceMap = [
          { type: ServiceType.CANINE_REG, price: dto.canineRegPrice },
          { type: ServiceType.LITTER_REG, price: dto.litterRegPrice },
          { type: ServiceType.TRANSFER, price: dto.transferPrice },
          { type: ServiceType.CERTIFICATE, price: dto.certificatePrice },
        ];

        // 3. Upsert ServicePricing for each service
        for (const service of servicePriceMap) {
          if (service.price !== undefined) {
            await tx.servicePricing.upsert({
              where: {
                serviceType_membershipId: {
                  serviceType: service.type,
                  membershipId: id,
                },
              },
              update: { price: service.price },
              create: {
                serviceType: service.type,
                membershipId: id,
                price: service.price,
              },
            });
          }
        }

        return updatedMembership;
      });
    } catch (error: any) {
      this.logger.error(`Update Failed: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to update membership plan',
      );
    }
  }

  async deletePlan(id: string) {
    try {
      const now = new Date();

      // 1. Check for active/valid subscriptions
      const plan = await this.prisma.membership.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              subscriptions: {
                where: {
                  status: SubscriptionStatus.PAID,
                  currentPeriodEnd: {
                    gt: now, // Check if the subscription period is still ongoing
                  },
                },
              },
            },
          },
        },
      });

      if (!plan) throw new NotFoundException('Plan not found');

      // 2. Logic: If count > 0, it means someone is still using the plan within their paid period
      if (plan._count.subscriptions > 0) {
        throw new BadRequestException(
          'Cannot delete plan. There are users with active subscriptions that haven’t expired yet.',
        );
      }

      // 3. Delete the plan if no active periods are found
      await this.prisma.membership.delete({ where: { id } });

      return {
        success: true,
        message: 'Membership plan deleted successfully',
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Delete Failed: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to delete membership plan',
      );
    }
  }
}
