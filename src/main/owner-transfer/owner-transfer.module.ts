import { Module } from '@nestjs/common';

import { OwnerTransferController } from './owner-transfer.controller';
import { OwnershipTransferService } from './owner-transfer.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Module({
  providers: [OwnershipTransferService, PrismaService, MailService],
  controllers: [OwnerTransferController],
})
export class OwnerTransferModule {}
