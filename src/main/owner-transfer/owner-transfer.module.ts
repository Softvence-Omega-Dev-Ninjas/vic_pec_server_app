import { Module } from '@nestjs/common';

import { OwnerTransferController } from './owner-transfer.controller';
import { OwnershipTransferService } from './owner-transfer.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [OwnershipTransferService, PrismaService],
  controllers: [OwnerTransferController],
})
export class OwnerTransferModule {}
