import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './main/prisma/prisma.module';
import { UserModule } from './main/admin/user/user.module';
import { SeedModule } from './main/seed/seed.module';
import { SeedService } from './main/seed/seed.service';

@Module({
  imports: [PrismaModule, UserModule, SeedModule],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
