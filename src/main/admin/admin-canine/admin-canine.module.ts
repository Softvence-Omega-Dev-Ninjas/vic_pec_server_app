import { Module } from '@nestjs/common';
import { AdminCanineService } from './admin-canine.service';
import { AdminCanineController } from './admin-canine.controller';
import { PermissionService } from '../permission/permission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionGuard } from '../../../guard/permission.guard';

@Module({
  providers: [
    AdminCanineService,
    PrismaService,
    PermissionGuard,
    PermissionService,
  ],
  controllers: [AdminCanineController],
})
export class AdminCanineModule {}
