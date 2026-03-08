/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './main/prisma/prisma.module';

import { SeedModule } from './main/seed/seed.module';
import { SeedService } from './main/seed/seed.service';
import { AdminUserModule } from './main/admin/admin-user/admin-user.module';
import { MailModule } from './main/mail/mail.module';
import { PrismaService } from './main/prisma/prisma.service';
import { MailService } from './main/mail/mail.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './main/user/user.module';
import { CanineModule } from './main/canine/canine.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BreedModule } from './main/breed/breed.module';
import { LitterModule } from './main/litter/litter.module';
import { OwnerTransferModule } from './main/owner-transfer/owner-transfer.module';
import { ReportModule } from './main/report/report.module';
import { PermissionModule } from './main/admin/permission/permission.module';
import { MembershipPlanModule } from './main/admin/membership-plan/membership-plan.module';
import { PaymentModule } from './main/payment/payment.module';
import { StripeWebhookModule } from './main/stripe-webhook/stripe-webhook.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super-secret',
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
    SeedModule,
    AdminUserModule,
    MailModule,
    UserModule,
    CanineModule,
    CloudinaryModule,
    BreedModule,
    LitterModule,
    OwnerTransferModule,
    ReportModule,
    PermissionModule,
    MembershipPlanModule,
    PaymentModule,
    StripeWebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService, PrismaService, MailService],
})
export class AppModule {}
