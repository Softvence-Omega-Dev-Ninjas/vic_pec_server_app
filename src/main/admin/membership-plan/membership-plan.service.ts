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
          stripePriceId: dto.stripePriceId,
          canineLimit: dto.canineLimit,
          features: dto.features, // JSON Field
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
      const plan = await this.prisma.membership.findUnique({
        where: { id },
        include: { _count: { select: { users: true } } },
      });

      if (!plan) throw new NotFoundException('Plan not found');

      if (plan._count.users > 0) {
        throw new BadRequestException('Cannot delete plan with active users');
      }

      await this.prisma.membership.delete({ where: { id } });
      return { success: true, message: 'Plan deleted successfully' };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Failed to delete plan');
    }
  }
}
