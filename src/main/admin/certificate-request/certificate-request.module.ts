import { Module } from '@nestjs/common';
import { CertificateRequestService } from './certificate-request.service';
import { CertificateRequestController } from './certificate-request.controller';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { PermissionService } from '../permission/permission.service';

@Module({
  providers: [CertificateRequestService, PrismaService, PermissionService],
  controllers: [CertificateRequestController],
})
export class CertificateRequestModule {}
