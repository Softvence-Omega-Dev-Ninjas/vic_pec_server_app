import { Module } from '@nestjs/common';
// import { RequestHelthReportController } from './request-helth-report.controller';
import { RequestHealthReportService } from './request-helth-report.service';
import { RequestHealthReportController } from './request-helth-report.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RequestHealthReportController],
  providers: [RequestHealthReportService, PrismaService],
})
export class RequestHelthReportModule {}
