import { Module } from '@nestjs/common';
import { AdminOwnerTransferService } from './admin-owner-transfer.service';
import { AdminOwnerTransferController } from './admin-owner-transfer.controller';
import { PermissionService } from '../permission/permission.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [AdminOwnerTransferService, PrismaService, PermissionService],
  controllers: [AdminOwnerTransferController],
})
export class AdminOwnerTransferModule {}
