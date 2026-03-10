import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreateHealthRequestDto,
  UpdateHealthRequestStatusDto,
} from './dto/create-health-request.dto';
import { RequestHealthReportService } from './request-helth-report.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';

@ApiTags('Health Access Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('health-requests')
export class RequestHealthReportController {
  constructor(private readonly service: RequestHealthReportService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new health record access request' })
  @ApiResponse({ status: 201, description: 'Request sent successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or request already exists.',
  })
  async send(
    @Req() req: Request & { userId: string },
    @Body() dto: CreateHealthRequestDto,
  ) {
    return this.service.sendRequest(req.userId, dto);
  }

  @Patch(':requestUserId/status')
  @ApiOperation({
    summary: 'Approve or Reject a health access request (Owner Only)',
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You are not the owner.',
  })
  async update(
    @Req() req: Request & { userId: string },
    @Param('requestUserId') requestId: string,
    @Body() dto: UpdateHealthRequestStatusDto,
  ) {
    return this.service.updateStatus(req.userId, requestId, dto.status);
  }

  @Get('all')
  @ApiOperation({
    summary:
      'Get all health requests (both sent and received) for the current user',
  })
  async getAll(@Req() req: Request & { userId: string }) {
    return this.service.getAllRequests(req.userId);
  }

  @Get(':reqId')
  @ApiOperation({ summary: 'Get details of a specific health request' })
  @ApiResponse({ status: 200, description: 'Request details found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  async getOne(
    @Req() req: Request & { userId: string },
    @Param('reqId') requestId: string,
  ) {
    return this.service.getSingleRequest(req.userId, requestId);
  }
}
