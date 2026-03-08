import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Query,
  Delete,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import { PermissionService } from './permission.service';
import { PermissionDto } from './dto/permission.dto';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { RoleGuard } from 'src/guard/role.guard';
import { Roles } from 'src/decorator/roles.decorator';

import { ResourceType, RoleType } from 'generated/prisma/enums';
import { PermissionPaginationDto } from './dto/permission-query.dto';

@ApiTags('Admin Permission Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('admin-permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // ---------------- UPDATE PERMISSIONS ----------------

  @Patch('update/:adminId')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Replace all permissions for a specific admin' })
  @ApiParam({
    name: 'adminId',
    description: 'UUID of the admin user',
    type: String,
  })
  @ApiBody({
    type: PermissionDto,
    isArray: true,
    description: 'Array of resource-based permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions synchronized successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Admin not found',
  })
  async updatePermissions(
    @Param('adminId', ParseUUIDPipe) adminId: string,

    @Body() permissions: PermissionDto[],
  ) {
    return this.permissionService.updateAdminPermissions(adminId, permissions);
  }

  // ---------------- LIST ADMINS WITH PERMISSIONS ----------------

  @Get('list')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get paginated list of admins with their permissions',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'john',
  })
  async listAdmins(@Query() query: PermissionPaginationDto) {
    return this.permissionService.getAllAdminsWithPermissions(query);
  }

  // ---------------- REVOKE RESOURCE ACCESS ----------------

  @Delete(':adminId/:resource')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Remove a specific resource permission from an admin',
  })
  @ApiParam({
    name: 'adminId',
    description: 'UUID of the admin user',
    type: String,
  })
  @ApiParam({
    name: 'resource',
    enum: ResourceType,
    description: 'Resource to revoke permission from',
  })
  async revokeResourceAccess(
    @Param('adminId', ParseUUIDPipe) adminId: string,

    @Param('resource', new ParseEnumPipe(ResourceType))
    resource: ResourceType,
  ) {
    return this.permissionService.deleteResourcePermission(adminId, resource);
  }
}
