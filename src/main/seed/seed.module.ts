import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [SeedService, PrismaService],
  exports: [SeedService],
})
export class SeedModule {}
