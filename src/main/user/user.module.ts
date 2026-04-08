import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailService } from '../mail/mail.service';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfileController } from './profile/user-profile.controller';
import { UserProfileService } from './profile/user-profile.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

@Module({
  providers: [
    UserService,
    MailService,
    JwtStrategy,
    PrismaService,
    UserProfileService,
    CloudinaryService,
    NotificationsService,
    NotificationsGateway,
  ],
  controllers: [UserController, UserProfileController],
})
export class UserModule {}
