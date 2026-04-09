/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { CreateCertificateRequestDto } from './dto/certificate-request.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from '../../payment/payment.service';

@Injectable()
export class CertificateRequestService {
  constructor(
    private prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  // 1. Get All Requests with logic-based filtering and safe pagination
  async getAllRequests(query: any) {
    const { status, search, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { owner: { fullName: { contains: search, mode: 'insensitive' } } },
          { owner: { email: { contains: search, mode: 'insensitive' } } },
          { requestId: { contains: search, mode: 'insensitive' } },
          { canine: { name: { contains: search, mode: 'insensitive' } } },
          { canine: { pcrId: { contains: search, mode: 'insensitive' } } },
          { litter: { pcrId: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.certificateRequest.findMany({
        where,
        include: {
          owner: {
            select: { id: true, fullName: true, email: true, pcrId: true },
          },
          canine: {
            select: { id: true, name: true, pcrId: true, tier: true },
          },
          litter: {
            select: { id: true, pcrId: true, tier: true },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.certificateRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  // 2. Get Detail with existence check
  async getById(id: string) {
    const request = await this.prisma.certificateRequest.findUnique({
      where: { id },
      include: {
        owner: true,
        canine: true,
        litter: true,
      },
    });

    if (!request) {
      throw new NotFoundException(
        `Certificate request with ID ${id} not found`,
      );
    }

    return request;
  }

  // 3. Update Status with business logic validation
  async updateStatus(
    id: string,
    status: 'APPROVED' | 'DECLINE' | 'PENDING' | 'UNDER_REVIEW',
  ) {
    // 1. Fetch current request status
    const request = await this.prisma.certificateRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // 2. Validation: Prevent duplicate approval logic
    if (request.status === status) {
      throw new BadRequestException(
        `This certificate is already in ${status} status`,
      );
    }

    // 4. Update with Issued Date logic
    return this.prisma.certificateRequest.update({
      where: { id },
      data: {
        status: status as any,
        // If moving back to PENDING or UNDER_REVIEW, we clear the issuedDate
        issuedDate: status === 'APPROVED' ? new Date() : null,
      },
    });
  }
  // 4. Delete with existence validation
  async delete(id: string) {
    const request = await this.prisma.certificateRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Cannot delete: Request not found');
    }

    // Optional: Prevent deletion of already approved certificates for record keeping
    if (request.status === 'APPROVED') {
      throw new BadRequestException(
        'Cannot delete an approved certificate record',
      );
    }

    return this.prisma.certificateRequest.delete({
      where: { id },
    });
  }

  private async validateEligibility(
    ownerId: string,
    dto: CreateCertificateRequestDto,
  ) {
    if (dto.canineId) {
      const canine = await this.prisma.canine.findUnique({
        where: { id: dto.canineId },
      });
      if (!canine || canine.status !== 'APPROVED') {
        throw new BadRequestException('Canine not found or not yet approved');
      }

      const existing = await this.prisma.certificateRequest.findFirst({
        where: {
          canineId: dto.canineId,
          ownerId,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });
      if (existing)
        throw new BadRequestException(
          'Request already exists or certificate issued',
        );
    }

    if (dto.litterId) {
      const litter = await this.prisma.litter.findUnique({
        where: { id: dto.litterId },
      });
      if (!litter || litter.status !== 'APPROVED') {
        throw new BadRequestException('Litter not found or not yet approved');
      }
    }
  }

  // 5. User Side: Create Request with Validation
  async createRequest(ownerId: string, dto: CreateCertificateRequestDto) {
    await this.validateEligibility(ownerId, dto);

    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      include: { membership: { include: { servicePricings: true } } },
    });

    if (!user?.membership)
      throw new BadRequestException('No active membership found');

    const certPricing = user.membership.servicePricings.find(
      (sp) => sp.serviceType === 'CERTIFICATE',
    );
    const basePrice = certPricing?.price || 0;
    const discount = user.membership.certificateDiscount || 0;
    const finalAmount = Math.round(basePrice * (1 - discount) * 100);

    if (finalAmount <= 0) {
      return await this.prisma.$transaction(async (tx) => {
        return await this.executeRequestCreation(tx, ownerId, dto);
      });
    }

    // method name matching: paymentService e createCertificateSession ache
    return await this.paymentService.createCertificateSession(ownerId, dto);
  }

  // 2. Database logic (Webhook theke call hobe)
  async executeRequestCreation(tx: any, ownerId: string, dto: any) {
    const generatedRequestId = `CERT-${Date.now().toString().slice(-6)}`;

    return await tx.certificateRequest.create({
      data: {
        requestId: generatedRequestId,
        ownerId,
        canineId: dto.canineId || null,
        litterId: dto.litterId || null,
        status: 'PENDING',
      },
    });
  }

  async getMyRequests(ownerId: string) {
    return this.prisma.certificateRequest.findMany({
      where: { ownerId },
      include: {
        canine: {
          select: { name: true, pcrId: true, images: true, microchipId: true },
        },
        litter: {
          select: { name: true, pcrId: true, images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
