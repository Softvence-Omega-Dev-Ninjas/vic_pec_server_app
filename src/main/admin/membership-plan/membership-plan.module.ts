import { Module } from '@nestjs/common';
import { MembershipPlanController } from './membership-plan.controller';
import { MembershipPlanService } from './membership-plan.service';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { PermissionService } from '../permission/permission.service';
import { PermissionGuard } from 'src/guard/permission.guard';

@Module({
  controllers: [MembershipPlanController],
  providers: [
    MembershipPlanService,
    PrismaService,
    PermissionService,
    PermissionGuard,
  ],
})
export class MembershipPlanModule {}
