import {
  Controller,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatsAndTireService } from './stats-and-tire.service';
import { UpdateRegistryTierDto } from './dto/assign-tire.dto';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
// import { RoleGuard } from 'src/guard/role.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { ResourceType, RoleType } from 'generated/prisma/enums';
import { PermissionGuard } from 'src/guard/permission.guard';
import { CheckPermission } from 'src/decorator/CheckPermission.decorator';
import { PermissionAction } from '../permission/permission.service';

@ApiTags('Admin - Registry Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
@Controller('admin/registry')
export class AdminStatsAndTireController {
  constructor(private readonly statsService: StatsAndTireService) {}

  @CheckPermission(ResourceType.CANINE, PermissionAction.EDIT)
  @Patch('canine/:id/tier')
  @ApiOperation({ summary: 'Update Canine Tier and PCR ID Prefix' })
  @ApiResponse({ status: 200, description: 'Tier updated successfully' })
  @ApiResponse({ status: 404, description: 'Canine not found' })
  async updateCanineTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegistryTierDto,
  ) {
    return await this.statsService.updateCanineTier(id, dto);
  }

  @CheckPermission(ResourceType.CANINE, PermissionAction.EDIT)
  @Patch('litter/:id/tier')
  @ApiOperation({ summary: 'Update Litter Tier' })
  @ApiResponse({ status: 200, description: 'Litter tier updated successfully' })
  @ApiResponse({ status: 404, description: 'Litter not found' })
  async updateLitterTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegistryTierDto,
  ) {
    return await this.statsService.updateLitterTier(id, dto);
  }
}
