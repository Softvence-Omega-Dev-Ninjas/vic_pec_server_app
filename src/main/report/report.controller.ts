/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { CreateReportDto, UpdateReportStatusDto } from './dto/report.dto';
import { RoleGuard } from 'src/guard/role.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { RoleType } from 'generated/prisma/enums';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('Report Management')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit a report against a canine or litter' })
  async submit(@Req() req: any, @Body() dto: CreateReportDto) {
    const userId = req.userId || null;
    return await this.reportService.createReport(userId, dto);
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get all reports with pagination' })
  async getAdminReports(@Query() query: ReportQueryDto) {
    return await this.reportService.getReportsForAdmin(query);
  }

  @Get('admin/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get single report details' })
  async getSingleReport(@Param('id') id: string) {
    return await this.reportService.getSingleReport(id);
  }

  @Patch('admin/:id/action')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Admin: Resolve report and take action against owner',
  })
  @ApiQuery({
    name: 'action',
    enum: ['SUSPEND_OWNER', 'MARK_AS_RESOLVED'],
    required: false,
  })
  async takeAction(
    @Param('id') id: string,
    @Body() updateDto: UpdateReportStatusDto,
    @Query('action') action?: 'SUSPEND_OWNER' | 'MARK_AS_RESOLVED',
  ) {
    return await this.reportService.resolveReportAction(
      id,
      updateDto.status,
      updateDto.priority,
      action,
    );
  }
}
