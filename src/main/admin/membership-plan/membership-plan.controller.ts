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

import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { RoleGuard } from 'src/guard/role.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { RoleType } from 'generated/prisma/enums';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from './dto/create-membership-plan.dto';

@ApiTags('Admin Membership Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('admin/membership-plans')
export class MembershipPlanController {
  constructor(private readonly planService: MembershipPlanService) {}

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

  @Patch(':membershipId')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a plan' })
  async update(
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return await this.planService.updatePlan(membershipId, dto);
  }

  @Delete(':membershipId')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a plan' })
  async remove(@Param('membershipId', ParseUUIDPipe) membershipId: string) {
    return await this.planService.deletePlan(membershipId);
  }
}
