import { Module } from '@nestjs/common';
import { MembershipPlanController } from './membership-plan.controller';
import { MembershipPlanService } from './membership-plan.service';

import { PermissionService } from '../permission/permission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionGuard } from '../../../guard/permission.guard';

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
