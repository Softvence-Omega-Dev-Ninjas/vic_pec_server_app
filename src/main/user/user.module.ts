import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailService } from '../mail/mail.service';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [UserService, MailService, JwtStrategy, PrismaService],
  controllers: [UserController],
})
export class UserModule {}
