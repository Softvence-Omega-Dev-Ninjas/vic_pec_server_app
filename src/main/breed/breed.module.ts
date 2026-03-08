import { Module } from '@nestjs/common';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [BreedService, PrismaService],
  controllers: [BreedController],
})
export class BreedModule {}
