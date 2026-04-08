/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Res,
  Param,
  Get,
  Query,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminUserService } from './admin-user.service';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';
import { ResourceType, UserStatus } from '../../../../generated/prisma/enums';
import { PermissionAction } from '../permission/permission.service';
import { JwtAuthGuard } from '../../../guard/jwt.auth.guard';
import { PermissionGuard } from '../../../guard/permission.guard';
import { CheckPermission } from '../../../decorator/CheckPermission.decorator';

@UseGuards(JwtAuthGuard)
@ApiTags('Admin / User Management')
@Controller('admin-user')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.USER, PermissionAction.CREATE)
  @Post('create')
  @ApiOperation({ summary: 'Create a new user by Admin' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request / Email exists' })
  async createUser(
    @Body() createUserDto: CreateUserByAdminDto,
    @Res() res: Response,
  ) {
    try {
      const result =
        await this.adminUserService.createUserByAdmin(createUserDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error: any) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.USER, PermissionAction.CREATE)
  @Post(':userId/approve')
  @ApiOperation({ summary: 'Approve a verified user' })
  @ApiResponse({ status: 200, description: 'User approved.' })
  @ApiResponse({
    status: 400,
    description: 'User not verified or already active.',
  })
  async approve(@Param('userId') userId: string) {
    return this.adminUserService.approveUser(userId);
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.USER, PermissionAction.CREATE)
  @Post(':userId/reject')
  @ApiOperation({ summary: 'Reject a user application' })
  async reject(@Param('userId') userId: string) {
    return this.adminUserService.rejectUser(userId);
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.USER, PermissionAction.CREATE)
  @Post(':userId/suspend')
  @ApiOperation({ summary: 'Suspend an active user account' })
  async suspend(@Param('userId') userId: string) {
    return this.adminUserService.suspendUser(userId);
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.USER, PermissionAction.VIEW)
  @Get('get-users')
  @ApiOperation({ summary: 'Get all users with search and pagination' })
  // সোয়াগারে অপশনাল দেখানোর জন্য এই ডেকোরেটরগুলো যোগ করুন
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    type: String,
    example: 'true',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email or pcrId',
  })
  async getAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: UserStatus,
    @Query('isVerified') isVerified?: string,
    @Query('search') search?: string,
  ) {
    return this.adminUserService.getAllUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      status,
      isVerified:
        isVerified === 'true'
          ? true
          : isVerified === 'false'
            ? false
            : undefined,
      search,
    });
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.USER, PermissionAction.VIEW)
  @Get('get-users/:userId')
  @ApiOperation({ summary: 'Get user details by userId' })
  async getOne(@Param('userId') userId: string) {
    return this.adminUserService.getUserById(userId);
  }

  // admin-user.controller.ts এ যোগ করুন
  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.USER, PermissionAction.DELETE)
  @Delete(':userId')
  @ApiOperation({ summary: 'Delete a user' })
  async delete(@Param('userId') userId: string) {
    return this.adminUserService.deleteUser(userId);
  }

  // admin-user.controller.ts
  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.USER, PermissionAction.EDIT)
  @Patch(':userId')
  @ApiOperation({ summary: 'Update user profile' })
  async update(
    @Param('userId') userId: string,
    @Body() dto: Partial<CreateUserByAdminDto>,
  ) {
    return this.adminUserService.updateUser(userId, dto);
  }
}
