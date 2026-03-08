import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Stripe Webhooks')
@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe Webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException(
        'Raw body missing. Check main.ts configuration.',
      );
    }

    return await this.webhookService.handleWebhook(signature, rawBody);
  }
}
