import { Module } from '@nestjs/common';
import { AdminOwnerTransferService } from './admin-owner-transfer.service';
import { AdminOwnerTransferController } from './admin-owner-transfer.controller';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { PermissionService } from '../permission/permission.service';

@Module({
  providers: [AdminOwnerTransferService, PrismaService, PermissionService],
  controllers: [AdminOwnerTransferController],
})
export class AdminOwnerTransferModule {}
