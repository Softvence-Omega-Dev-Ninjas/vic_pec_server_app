import { Module } from '@nestjs/common';
import { CertificateRequestService } from './certificate-request.service';
import { CertificateRequestController } from './certificate-request.controller';

import { PermissionService } from '../permission/permission.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [CertificateRequestService, PrismaService, PermissionService],
  controllers: [CertificateRequestController],
})
export class CertificateRequestModule {}
