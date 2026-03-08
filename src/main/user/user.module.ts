import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailService } from '../mail/mail.service';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfileController } from './profile/user-profile.controller';
import { UserProfileService } from './profile/user-profile.service';

@Module({
  providers: [
    UserService,
    MailService,
    JwtStrategy,
    PrismaService,
    UserProfileService,
  ],
  controllers: [UserController, UserProfileController],
})
export class UserModule {}
