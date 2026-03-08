import { Module } from '@nestjs/common';
import { LitterService } from './litter.service';
import { LitterController } from './litter.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  providers: [LitterService, PrismaService, CloudinaryService],
  controllers: [LitterController],
})
export class LitterModule {}
