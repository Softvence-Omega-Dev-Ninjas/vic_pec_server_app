/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from '../admin/membership-plan/dto/create-checkout.dto';

import { RoleType } from '../../../generated/prisma/enums';
import { PaginationDto, RevenueFilterDto } from './dto/PaginationDto';
import { JwtAuthGuard } from '../../guard/jwt.auth.guard';
import { Roles } from '../../decorator/roles.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create a Stripe checkout session for membership' })
  async checkout(@Body() dto: CreateCheckoutDto, @Req() req: any) {
    return await this.paymentService.createCheckoutSession(
      req.userId,
      dto.membershipId,
    );
  }

  @Get('/admin/all')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all subscription payments (Pagination)' })
  async findAll(@Query() dto: PaginationDto) {
    return await this.paymentService.getAllPayments(dto);
  }

  @Get('/admin/revenue-stats')
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get day-wise revenue stats for a specific month' })
  async getStats(@Query() dto: RevenueFilterDto) {
    return await this.paymentService.getRevenueStats(dto);
  }
}
