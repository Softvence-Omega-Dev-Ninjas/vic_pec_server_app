import { Module } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { AdminUserController } from './admin-user.controller';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { MailService } from 'src/main/mail/mail.service';

@Module({
  providers: [AdminUserService, PrismaService, MailService],
  controllers: [AdminUserController],
})
export class AdminUserModule {}
