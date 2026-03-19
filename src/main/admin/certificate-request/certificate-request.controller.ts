/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { PermissionGuard } from 'src/guard/permission.guard';
import { CheckPermission } from 'src/decorator/CheckPermission.decorator';
import { ResourceType } from 'generated/prisma/enums';
import { PermissionAction } from '../permission/permission.service';
import {
  CertificateQueryDto,
  CreateCertificateRequestDto,
} from './dto/certificate-request.dto';
import { CertificateRequestService } from './certificate-request.service';

@ApiTags('Certificate Management (User & Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certificate-request')
export class CertificateRequestController {
  constructor(private readonly certificateService: CertificateRequestService) {}

  @Post('create')
  @ApiOperation({ summary: 'User: Submit a new certificate request' })
  async create(@Req() req: any, @Body() dto: CreateCertificateRequestDto) {
    const userId = req.userId;
    return this.certificateService.createRequest(userId, dto);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'User: Get all personal certificate requests' })
  async getMyRequests(@Req() req: any) {
    const userId = req.userId;
    return this.certificateService.getMyRequests(userId);
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.CERTIFICATE, PermissionAction.VIEW)
  @Get('admin/list')
  @ApiOperation({ summary: 'Admin: List all requests with filters' })
  async getAll(@Query() query: CertificateQueryDto) {
    return this.certificateService.getAllRequests(query);
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.CERTIFICATE, PermissionAction.VIEW)
  @Get('admin/:id')
  @ApiOperation({ summary: 'Admin: Get request details by ID' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificateService.getById(id);
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.CERTIFICATE, PermissionAction.EDIT)
  @Patch('admin/status/:id')
  @ApiOperation({ summary: 'Admin: Update request status (Approve/Reject)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'APPROVED' },
      },
    },
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: 'APPROVED' | 'DECLINE' | 'PENDING' | 'UNDER_REVIEW',
  ) {
    return this.certificateService.updateStatus(id, status);
  }

  @UseGuards(PermissionGuard)
  @CheckPermission(ResourceType.CERTIFICATE, PermissionAction.DELETE)
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin: Delete a certificate request' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificateService.delete(id);
  }
}
