/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminLitterService } from './admin-litter.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { PermissionGuard } from 'src/guard/permission.guard';
import { CheckPermission } from 'src/decorator/CheckPermission.decorator';
import { ResourceType } from 'generated/prisma/enums';
import { PermissionAction } from '../permission/permission.service';
import {
  AdminLitterQueryDto,
  UpdateLitterAdminDto,
} from './dto/admin-litter.dto';

@ApiTags('Admin / Litter Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin-litter')
export class AdminLitterController {
  constructor(private readonly adminLitterService: AdminLitterService) {}

  @CheckPermission(ResourceType.CANINE, PermissionAction.VIEW)
  @Get('get-litters')
  @ApiOperation({ summary: 'Get all litters with advanced filters' })
  async getAll(@Query() query: AdminLitterQueryDto) {
    return this.adminLitterService.getAllLitters(query);
  }

  @CheckPermission(ResourceType.CANINE, PermissionAction.VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Get single litter full details' })
  async getOne(@Param('id') id: string) {
    return this.adminLitterService.getLitterById(id);
  }

  @CheckPermission(ResourceType.CANINE, PermissionAction.EDIT)
  @Patch(':id')
  @ApiOperation({ summary: 'Update litter status, tier or basic info' })
  async update(@Param('id') id: string, @Body() dto: UpdateLitterAdminDto) {
    return this.adminLitterService.updateLitter(id, dto);
  }

  @CheckPermission(ResourceType.CANINE, PermissionAction.DELETE)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove a litter record' })
  async remove(@Param('id') id: string) {
    return this.adminLitterService.deleteLitter(id);
  }
}
