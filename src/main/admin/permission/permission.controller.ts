/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  Post,
  Req,
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

  @Post('assign/:adminId')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign a single resource permission to an admin' })
  @ApiParam({
    name: 'adminId',
    description: 'UUID of the admin user',
    type: String,
  })
  @ApiBody({
    type: PermissionDto,
    description:
      'Resource permission details (e.g. resource: CANINE, canView: true)',
  })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Permission for this resource already exists for this admin',
  })
  async createPermission(
    @Param('adminId', ParseUUIDPipe) adminId: string,
    @Body() dto: PermissionDto,
  ) {
    return this.permissionService.createPermission(adminId, dto);
  }

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

  @Delete('resource/:adminId/:resource')
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

  @Roles(RoleType.ADMIN)
  @Get('my-permissions')
  @ApiOperation({ summary: 'Get current logged-in admin permissions' })
  @ApiResponse({ status: 200, description: 'Returns list of permissions' })
  async getMyPermissions(@Req() req: any) {
    // Note: Request object theke user id neoa tai best practice (e.g., req.user.id)
    return this.permissionService.getMyPermissions(req.userId);
  }

  @Get('admins')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get list of all users with ADMIN role' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of admins',
  })
  async getAdmins() {
    return this.permissionService.getAllAdmins();
  }

  @Delete('all-admin/:adminId')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove all permissions from a specific admin' })
  async clearAdminPermissions(
    @Param('adminId', ParseUUIDPipe) adminId: string,
  ) {
    console.log(`[Controller] Deleting all permissions for: ${adminId}`);
    return await this.permissionService.deleteAllAdminPermissions(adminId);
  }
}
