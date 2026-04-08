import { Module } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { AdminUserController } from './admin-user.controller';

// import { PermissionGuard } from 'src/guard/permission.guard';
import { PermissionService } from '../permission/permission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { PermissionGuard } from '../../../guard/permission.guard';

@Module({
  providers: [
    AdminUserService,
    PrismaService,
    MailService,
    PermissionService,
    PermissionGuard,
  ],
  controllers: [AdminUserController],
})
export class AdminUserModule {}
