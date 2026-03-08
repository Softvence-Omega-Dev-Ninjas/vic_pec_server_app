/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OwnershipTransferService } from './owner-transfer.service';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';
import {
  ClaimTransferDto,
  CreateTransferDto,
  TransferQueryDto,
} from './dto/create-transfer.dto';

@ApiTags('Ownership Transfer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('owner-transfer')
export class OwnerTransferController {
  constructor(private readonly transferService: OwnershipTransferService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate a unique transfer code for a canine or litter',
  })
  async createRequest(@Req() req: any, @Body() dto: CreateTransferDto) {
    return await this.transferService.createTransferRequest(req.userId, dto);
  }

  @Post('claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim ownership using a valid transfer code' })
  async claim(@Req() req: any, @Body() dto: ClaimTransferDto) {
    return await this.transferService.claimTransfer(req.userId, dto);
  }

  @Get('my-list')
  @ApiOperation({
    summary: 'Get list of sent and received transfers for the logged-in user',
  })
  async getMyTransfers(@Req() req: any, @Query() query: TransferQueryDto) {
    return await this.transferService.getUserTransfers(req.userId, query);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get the complete ownership history/chain for a canine or litter',
  })
  @ApiQuery({ name: 'canineId', required: false, type: String })
  @ApiQuery({ name: 'litterId', required: false, type: String })
  async getHistory(
    @Query('canineId') canineId?: string,
    @Query('litterId') litterId?: string,
  ) {
    return await this.transferService.getTransferHistory(canineId, litterId);
  }
}
