/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from '../admin/membership-plan/dto/create-checkout.dto';

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
}
