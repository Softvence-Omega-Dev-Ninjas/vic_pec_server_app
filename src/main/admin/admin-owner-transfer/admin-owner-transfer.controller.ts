/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AdminOwnerTransferService } from './admin-owner-transfer.service';
import { ResourceType } from '../../../../generated/prisma/enums';
import { PermissionAction } from '../permission/permission.service';
import { TransferQueryDto } from './dto/TransferQueryDto';
import { JwtAuthGuard } from '../../../guard/jwt.auth.guard';
import { PermissionGuard } from '../../../guard/permission.guard';
import { CheckPermission } from '../../../decorator/CheckPermission.decorator';

@ApiTags('Admin / Ownership Transfer Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin-owner-transfer')
export class AdminOwnerTransferController {
  constructor(
    private readonly adminTransferService: AdminOwnerTransferService,
  ) {}

  @CheckPermission(ResourceType.TRANSFER_OWNERSHIP, PermissionAction.VIEW)
  @Get('list')
  @ApiOperation({
    summary: 'Get all transfer requests with pagination and filters',
  })
  async getAll(@Query() query: TransferQueryDto) {
    return this.adminTransferService.getAllTransfers(query);
  }

  @CheckPermission(ResourceType.TRANSFER_OWNERSHIP, PermissionAction.VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific transfer request' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminTransferService.getTransferById(id);
  }

  @CheckPermission(ResourceType.TRANSFER_OWNERSHIP, PermissionAction.EDIT)
  @Patch('approve/:id')
  @ApiOperation({
    summary:
      'Approve a verified ownership transfer by selecting a specific user from the request list',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        selectedUserId: {
          type: 'string',
          format: 'uuid',
          example: 'user-uuid-here',
        },
      },
      required: ['selectedUserId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Ownership officially transferred' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('selectedUserId', ParseUUIDPipe) selectedUserId: string,
  ) {
    // Admin array theke jake select korbe tar ID pass kora hocche
    return this.adminTransferService.approveTransfer(id, selectedUserId);
  }

  @CheckPermission(ResourceType.TRANSFER_OWNERSHIP, PermissionAction.EDIT)
  @Patch('decline/:id')
  @ApiOperation({ summary: 'Decline a transfer request' })
  async decline(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminTransferService.declineTransfer(id);
  }
}
