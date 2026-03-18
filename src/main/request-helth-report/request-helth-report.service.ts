import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import {
  CreateHealthRequestDto,
  UpdateRequestStatusDto,
} from './dto/create-health-request.dto';
import { HealthRequestStatus } from 'generated/prisma/enums';

@Injectable()
export class RequestHealthReportService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(requesterId: string, dto: CreateHealthRequestDto) {
    const { canineId, litterId, note } = dto;

    if (!canineId && !litterId) {
      throw new BadRequestException(
        'Either canineId or litterId must be provided.',
      );
    }

    let targetOwnerId: string;

    if (canineId) {
      const canine = await this.prisma.canine.findUnique({
        where: { id: canineId },
        select: { ownerId: true },
      });
      if (!canine) throw new NotFoundException('Canine not found');
      targetOwnerId = canine.ownerId;
    } else {
      const litter = await this.prisma.litter.findUnique({
        where: { id: litterId },
        select: { ownerId: true },
      });
      if (!litter) throw new NotFoundException('Litter not found');
      targetOwnerId = litter.ownerId;
    }

    if (requesterId === targetOwnerId) {
      throw new BadRequestException(
        'You cannot request access to your own records.',
      );
    }

    const existing = await this.prisma.canineHealthRequest.findFirst({
      where: {
        requesterId,
        canineId,
        litterId,
        status: HealthRequestStatus.PENDING,
      },
    });

    if (existing)
      throw new BadRequestException('A pending request already exists.');

    return this.prisma.canineHealthRequest.create({
      data: {
        requesterId,
        ownerId: targetOwnerId,
        canineId,
        litterId,
        note,
      },
    });
  }

  async updateStatus(
    ownerId: string,
    requestId: string,
    status: UpdateRequestStatusDto,
  ) {
    const request = await this.prisma.canineHealthRequest.findUnique({
      where: { id: requestId },
      select: { ownerId: true, status: true },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You do not have permission to modify this request.',
      );
    }

    return this.prisma.canineHealthRequest.update({
      where: { id: requestId },
      data: {
        status: status as HealthRequestStatus,
        approvedAt:
          status === UpdateRequestStatusDto.APPROVED ? new Date() : null,
      },
    });
  }
  async getAllRequests(userId: string) {
    return this.prisma.canineHealthRequest.findMany({
      where: {
        // Sudhu amake (Owner) ke kora request gulo get hobe
        ownerId: userId,
      },
      include: {
        requester: {
          select: {
            fullName: true,
            email: true,
            pcrId: true,
            profileImage: true,
          },
        },
        owner: { select: { fullName: true, email: true, pcrId: true } },
        canine: {
          select: {
            id: true,
            name: true,
            pcrId: true,
            images: { take: 1 },
            microchipId: true,
          },
        },
        litter: { select: { id: true, name: true, pcrId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSingleRequest(userId: string, requestId: string) {
    const request = await this.prisma.canineHealthRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: { select: { fullName: true, email: true, pcrId: true } },
        owner: { select: { fullName: true, email: true, pcrId: true } },
        canine: {
          include: {
            breedRelation: { select: { name: true } },
          },
        },
        litter: true,
      },
    });

    if (!request) throw new NotFoundException('Health request not found');
    if (request.requesterId !== userId && request.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this request.',
      );
    }

    return request;
  }
}
