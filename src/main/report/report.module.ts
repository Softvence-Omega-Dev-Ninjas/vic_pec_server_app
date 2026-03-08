import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ReportService, PrismaService],
  controllers: [ReportController],
})
export class ReportModule {}
