/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipPlanService } from './membership-plan.service';

import { ResourceType, RoleType } from '../../../../generated/prisma/enums';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from './dto/create-membership-plan.dto';
import { PermissionAction } from '../permission/permission.service';
import { JwtAuthGuard } from '../../../guard/jwt.auth.guard';
import { PermissionGuard } from '../../../guard/permission.guard';
import { CheckPermission } from '../../../decorator/CheckPermission.decorator';
import { Roles } from '../../../decorator/roles.decorator';

@ApiTags('Admin Membership Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/membership-plans')
export class MembershipPlanController {
  constructor(private readonly planService: MembershipPlanService) {}

  @CheckPermission(ResourceType.MEMBERSHIP_PLAN, PermissionAction.CREATE)
  @Post()
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new plan (Max 3)' })
  async create(@Body() dto: CreateMembershipDto) {
    return await this.planService.createPlan(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  async findAll() {
    return await this.planService.getAllPlans();
  }

  @CheckPermission(ResourceType.MEMBERSHIP_PLAN, PermissionAction.EDIT)
  @Patch(':membershipId')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a plan' })
  async update(
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return await this.planService.updatePlan(membershipId, dto);
  }

  @CheckPermission(ResourceType.MEMBERSHIP_PLAN, PermissionAction.DELETE)
  @Delete(':membershipId')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a plan' })
  async remove(@Param('membershipId', ParseUUIDPipe) membershipId: string) {
    return await this.planService.deletePlan(membershipId);
  }
}
