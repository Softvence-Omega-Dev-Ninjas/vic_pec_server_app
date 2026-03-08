import { Module } from '@nestjs/common';
import { MembershipPlanController } from './membership-plan.controller';
import { MembershipPlanService } from './membership-plan.service';
import { PrismaService } from 'src/main/prisma/prisma.service';

@Module({
  controllers: [MembershipPlanController],
  providers: [MembershipPlanService, PrismaService],
})
export class MembershipPlanModule {}
