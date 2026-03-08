/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';

import { TransferOwnershipStatus } from 'generated/prisma/enums';
import {
  ClaimTransferDto,
  CreateTransferDto,
  TransferQueryDto,
} from './dto/create-transfer.dto';

@Injectable()
export class OwnershipTransferService {
  private readonly logger = new Logger(OwnershipTransferService.name);

  constructor(private prisma: PrismaService) {}

  async createTransferRequest(userId: string, dto: CreateTransferDto) {
    try {
      const { canineId, litterId } = dto;

      if (!canineId && !litterId) {
        throw new BadRequestException(
          'Either Canine ID or Litter ID must be provided',
        );
      }

      if (canineId) {
        const canine = await this.prisma.canine.findUnique({
          where: { id: canineId },
        });
        if (!canine) throw new NotFoundException('Canine not found');
        if (canine.ownerId !== userId) {
          throw new ConflictException('You do not own this canine to transfer');
        }
      } else if (litterId) {
        const litter = await this.prisma.litter.findUnique({
          where: { id: litterId },
        });
        if (!litter) throw new NotFoundException('Litter not found');
        if (litter.ownerId !== userId) {
          throw new ConflictException('You do not own this litter to transfer');
        }
      }

      const existingPending = await this.prisma.ownershipTransfer.findFirst({
        where: {
          OR: [{ canineId }, { litterId }],
          status: TransferOwnershipStatus.PENDING,
        },
      });

      if (existingPending) {
        throw new ConflictException(
          'A transfer request is already pending for this item',
        );
      }

      const transferCode = `TRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      return await this.prisma.ownershipTransfer.create({
        data: {
          transferCode,
          canineId,
          litterId,
          currentOwnerId: userId,
          expiresAt,
          status: TransferOwnershipStatus.PENDING,
        },
        include: {
          canine: { select: { name: true, pcrId: true } },
          litter: { select: { name: true, pcrId: true } },
        },
      });
    } catch (error: any) {
      this.logger.error(`Transfer request failed: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating transfer request');
    }
  }

  async claimTransfer(newUserId: string, dto: ClaimTransferDto) {
    try {
      const { transferCode } = dto;

      const transfer = await this.prisma.ownershipTransfer.findUnique({
        where: { transferCode },
        include: {
          canine: true,
          litter: true,
        },
      });

      if (!transfer) {
        throw new NotFoundException('Invalid transfer code');
      }

      if (transfer.status !== TransferOwnershipStatus.PENDING) {
        throw new BadRequestException('This transfer is no longer active');
      }

      if (new Date() > transfer.expiresAt) {
        await this.prisma.ownershipTransfer.update({
          where: { id: transfer.id },
          data: { status: TransferOwnershipStatus.EXPIRED },
        });
        throw new BadRequestException('Transfer code has expired');
      }

      if (transfer.currentOwnerId === newUserId) {
        throw new BadRequestException('You are already the owner of this item');
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.ownershipTransfer.update({
          where: { id: transfer.id },
          data: {
            newOwnerId: newUserId,
            status: TransferOwnershipStatus.SUCCESSFUL,
          },
        });

        if (transfer.canineId) {
          await tx.canine.update({
            where: { id: transfer.canineId },
            data: { ownerId: newUserId },
          });
        } else if (transfer.litterId) {
          await tx.litter.update({
            where: { id: transfer.litterId },
            data: { ownerId: newUserId },
          });

          await tx.canine.updateMany({
            where: { litterId: transfer.litterId },
            data: { ownerId: newUserId },
          });
        }

        return {
          success: true,
          message: 'Ownership transferred successfully',
          transferredTo: newUserId,
        };
      });
    } catch (error: any) {
      this.logger.error(`Claim transfer failed: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred during ownership transfer',
      );
    }
  }

  async getTransferHistory(canineId?: string, litterId?: string) {
    try {
      if (!canineId && !litterId) {
        throw new BadRequestException('Provide either Canine ID or Litter ID');
      }

      const history = await this.prisma.ownershipTransfer.findMany({
        where: {
          OR: [{ canineId: canineId }, { litterId: litterId }],
          status: TransferOwnershipStatus.SUCCESSFUL,
        },
        include: {
          currentOwner: {
            select: { id: true, fullName: true, pcrId: true, email: true },
          },
          newOwner: {
            select: { id: true, fullName: true, pcrId: true, email: true },
          },
          canine: { select: { name: true, pcrId: true } },
          litter: { select: { name: true, pcrId: true } },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return history;
    } catch (error: any) {
      this.logger.error(`History fetch failed: ${error.message}`);
      throw new InternalServerErrorException(
        'Could not fetch transfer history',
      );
    }
  }

  async getUserTransfers(userId: string, query: TransferQueryDto) {
    const { page = 1, limit = 10, status, direction } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    if (direction === 'sent') {
      where.currentOwnerId = userId;
    } else if (direction === 'received') {
      where.newOwnerId = userId;
    } else {
      where.OR = [{ currentOwnerId: userId }, { newOwnerId: userId }];
    }

    const [data, total] = await Promise.all([
      this.prisma.ownershipTransfer.findMany({
        where,
        skip,
        take: limit,
        include: {
          canine: { select: { name: true, pcrId: true } },
          litter: { select: { name: true, pcrId: true } },
          currentOwner: { select: { fullName: true } },
          newOwner: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ownershipTransfer.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
