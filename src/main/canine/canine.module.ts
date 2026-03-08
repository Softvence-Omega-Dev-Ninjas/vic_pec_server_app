import { Module } from '@nestjs/common';
import { CanineService } from './canine.service';
import { CanineController } from './canine.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  providers: [CanineService, PrismaService, CloudinaryService],
  controllers: [CanineController],
})
export class CanineModule {}
