/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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

import {
  CanineStatus,
  ResourceType,
  TransferOwnershipStatus,
} from '../../../generated/prisma/enums';
import {
  ClaimTransferDto,
  CreateTransferDto,
  TransferQueryDto,
} from './dto/create-transfer.dto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class OwnershipTransferService {
  private readonly logger = new Logger(OwnershipTransferService.name);

  constructor(
    private prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createTransferRequest(userId: string, dto: CreateTransferDto) {
    try {
      const { canineId, litterId } = dto;

      if (!canineId && !litterId) {
        throw new BadRequestException(
          'Either Canine ID or Litter ID must be provided',
        );
      }

      // 1. Initial Validation
      if (canineId) {
        const canine = await this.prisma.canine.findUnique({
          where: { id: canineId },
        });
        if (!canine) throw new NotFoundException('Canine not found');
        if (canine.ownerId !== userId)
          throw new ConflictException('You do not own this canine');
        if (canine.status !== CanineStatus.APPROVED) {
          throw new BadRequestException(
            `Cannot transfer a canine with status: ${canine.status}`,
          );
        }
      } else {
        const litter = await this.prisma.litter.findUnique({
          where: { id: litterId },
        });
        if (!litter) throw new NotFoundException('Litter not found');
        if (litter.ownerId !== userId)
          throw new ConflictException('You do not own this litter');
        if (litter.status !== CanineStatus.APPROVED) {
          throw new BadRequestException(
            `Cannot transfer a litter with status: ${litter.status}`,
          );
        }
      }

      const transferCode = `TRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // 2. Transaction for cleanup and creation
      const transfer = await this.prisma.$transaction(async (tx) => {
        const existingPending = await tx.ownershipTransfer.findFirst({
          where: {
            OR: [
              { canineId: canineId || undefined },
              { litterId: litterId || undefined },
            ],
            status: TransferOwnershipStatus.PENDING,
          },
        });

        if (existingPending) {
          await tx.ownershipTransfer.delete({
            where: { id: existingPending.id },
          });
        }

        return await tx.ownershipTransfer.create({
          data: {
            transferCode,
            canineId,
            litterId,
            currentOwnerId: userId,
            expiresAt,
            isVerified: false,
            status: TransferOwnershipStatus.PENDING,
          },
          include: {
            // Ekhane canine/litter er bhetorer owner relation load kora hocche
            canine: {
              include: { owner: { select: { email: true, fullName: true } } },
            },
            litter: {
              include: { owner: { select: { email: true, fullName: true } } },
            },
          },
        });
      });

      // 3. Extracting owner info from the Item (Canine or Litter)
      const ownerInfo = transfer.canine?.owner || transfer.litter?.owner;
      const itemName = transfer.canine?.name || transfer.litter?.name || 'Item';
      const pcrId = transfer.canine?.pcrId || transfer.litter?.pcrId || 'N/A';
      console.log(ownerInfo?.email);
      if (ownerInfo?.email) {
        await this.mailService.sendTransferCodeEmail(
          ownerInfo.email,
          ownerInfo.fullName,
          itemName,
          pcrId,
          transferCode,
        );
      }

      await this.notificationsService.alertAdmins({
        title: 'New Ownership Transfer Request',
        message: `A transfer request has been created for ${itemName} (${pcrId}) by ${ownerInfo?.fullName || 'Owner'}.`,
        category: ResourceType.TRANSFER_OWNERSHIP,
        link: `/admin/transfers`, // Admin panel dashboard link
        sourceId: transfer.id,
      });

      return transfer;
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
          canine: { select: { name: true, pcrId: true } },
          litter: { select: { name: true, pcrId: true } },
          requests: true,
        },
      });

      if (!transfer) throw new NotFoundException('Invalid transfer code');

      if (transfer.status !== TransferOwnershipStatus.PENDING) {
        throw new BadRequestException('This transfer is no longer active');
      }

      if (new Date() > transfer.expiresAt) {
        await this.prisma.ownershipTransfer.update({
          where: { id: transfer.id },
          data: { status: TransferOwnershipStatus.DECLINE },
        });
        throw new BadRequestException('Transfer code expired');
      }

      if (transfer.currentOwnerId === newUserId) {
        throw new BadRequestException('You are already the owner of this item');
      }

      const hasAlreadyRequested = transfer.requests.some(
        (req) => req.userId === newUserId,
      );
      if (hasAlreadyRequested) {
        throw new ConflictException('You have already claimed this transfer');
      }

      const updatedTransfer = await this.prisma.ownershipTransfer.update({
        where: { id: transfer.id },
        data: {
          isVerified: true,
          verifiedAt: transfer.verifiedAt || new Date(),
          requests: {
            create: {
              userId: newUserId,
            },
          },
        },
      });

      const claimer = await this.prisma.user.findUnique({
        where: { id: newUserId },
        select: { email: true, fullName: true },
      });

      const itemName = transfer.canine?.name || transfer.litter?.name || 'Item';
      const pcrId = transfer.canine?.pcrId || transfer.litter?.pcrId || 'N/A';

      if (claimer?.email) {
        await this.mailService.sendTransferClaimedEmail(
          claimer.email,
          claimer.fullName,
          itemName,
          pcrId,
        );
      }

      await this.notificationsService.alertAdmins({
        title: 'Ownership Transfer Claimed',
        message: `${claimer?.fullName || 'A user'} has claimed the transfer for ${itemName} (${pcrId}). Pending admin approval.`,
        category: ResourceType.TRANSFER_OWNERSHIP,
        link: `/admin/transfers/${transfer.id}`,
        sourceId: transfer.id,
      });

      return updatedTransfer;
    } catch (error: any) {
      this.logger.error(`Claim transfer failed: ${error.message}`);
      // ... error handling
      throw error;
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
