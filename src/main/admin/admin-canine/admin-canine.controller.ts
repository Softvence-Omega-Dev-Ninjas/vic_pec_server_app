// admin-canine/admin-canine.controller.ts
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
import { AdminCanineService } from './admin-canine.service';
import { ResourceType } from '../../../../generated/prisma/enums';
import { PermissionAction } from '../permission/permission.service';
import {
  AdminCanineQueryDto,
  UpdateCanineAdminDto,
} from './dto/admin-canine-query.dto';
import { JwtAuthGuard } from '../../../guard/jwt.auth.guard';
import { PermissionGuard } from '../../../guard/permission.guard';
import { CheckPermission } from '../../../decorator/CheckPermission.decorator';

@ApiTags('Admin / Canine Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin-canine')
export class AdminCanineController {
  constructor(private readonly adminCanineService: AdminCanineService) {}

  @CheckPermission(ResourceType.CANINE, PermissionAction.VIEW)
  @Get('get-canines')
  @ApiOperation({ summary: 'Get all canines with advanced filters' })
  async getAll(@Query() query: AdminCanineQueryDto) {
    return this.adminCanineService.getAllCanines(query);
  }

  @CheckPermission(ResourceType.CANINE, PermissionAction.VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Get single canine full details' })
  async getOne(@Param('id') id: string) {
    return this.adminCanineService.getCanineById(id);
  }

  @CheckPermission(ResourceType.CANINE, PermissionAction.EDIT)
  @Patch(':id')
  @ApiOperation({ summary: 'Update canine status, tier or basic info' })
  async update(@Param('id') id: string, @Body() dto: UpdateCanineAdminDto) {
    return this.adminCanineService.updateCanine(id, dto);
  }

  @CheckPermission(ResourceType.CANINE, PermissionAction.DELETE)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove a canine record' })
  async remove(@Param('id') id: string) {
    return this.adminCanineService.deleteCanine(id);
  }
}
