/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { PrismaService } from 'src/main/prisma/prisma.service';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from './dto/create-membership-plan.dto';
import { SubscriptionStatus } from 'generated/prisma/enums';

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

      return await this.prisma.membership.create({
        data: {
          tier: dto.tier,
          name: dto.name,
          currentPrice: dto.currentPrice,
          canineLimit: dto.canineLimit,
          features: dto.features,
        },
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

      return await this.prisma.membership.update({
        where: { id },
        data: dto,
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
