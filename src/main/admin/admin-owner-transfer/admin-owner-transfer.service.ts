/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { TransferOwnershipStatus } from '../../../../generated/prisma/enums';
import { TransferQueryDto } from './dto/TransferQueryDto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminOwnerTransferService {
  private readonly logger = new Logger(AdminOwnerTransferService.name);

  constructor(private prisma: PrismaService) {}

  // 1. Get All Transfers with Requesters Profile
  async getAllTransfers(query: TransferQueryDto) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { transferCode: { contains: search, mode: 'insensitive' } },
          {
            currentOwner: {
              fullName: { contains: search, mode: 'insensitive' },
            },
          },
          { canine: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [rawTransfers, total] = await Promise.all([
      this.prisma.ownershipTransfer.findMany({
        where,
        skip,
        take: limit,
        include: {
          canine: { select: { id: true, name: true, pcrId: true } },
          litter: { select: { id: true, name: true, pcrId: true } },
          currentOwner: {
            select: { fullName: true, email: true, pcrId: true },
          },
          newOwner: { select: { fullName: true, email: true, pcrId: true } },
          requests: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, pcrId: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.ownershipTransfer.count({ where }),
    ]);
    const data = rawTransfers.map((transfer) => ({
      ...transfer,
      requesters: transfer.requests.map((r) => ({
        ...r.user,
        isAccepted: r.isAccepted,
      })),
    }));

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }
  // 2. Get Single Transfer with Full Requester List
  async getTransferById(id: string) {
    const transfer = await this.prisma.ownershipTransfer.findUnique({
      where: { id },
      include: {
        canine: true,
        litter: true,
        currentOwner: { select: { fullName: true, email: true, pcrId: true } },
        newOwner: { select: { fullName: true, email: true, pcrId: true } },
        requests: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, pcrId: true },
            },
          },
        },
      },
    });

    if (!transfer) throw new NotFoundException('Transfer request not found');

    return {
      ...transfer,
      requesters: transfer.requests.map((r) => ({
        ...r.user,
        isAccepted: r.isAccepted,
      })),
    };
  }

  async approveTransfer(id: string, selectedUserId: string) {
    const transfer = await this.prisma.ownershipTransfer.findUnique({
      where: { id },
      include: {
        requests: true,
      },
    });

    if (!transfer) throw new NotFoundException('Transfer request not found');

    const userRequest = transfer.requests.find(
      (req) => req.userId === selectedUserId,
    );
    if (!userRequest) {
      throw new BadRequestException('Selected user is not in the request list');
    }

    if (transfer.status !== TransferOwnershipStatus.PENDING) {
      throw new BadRequestException(`Transfer is already ${transfer.status}`);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.ownershipTransfer.update({
          where: { id },
          data: {
            status: TransferOwnershipStatus.APPROVE,
            newOwnerId: selectedUserId,
          },
        });

        await tx.transferRequest.update({
          where: {
            transferId_userId: {
              transferId: id,
              userId: selectedUserId,
            },
          },
          data: { isAccepted: true },
        });

        if (transfer.canineId) {
          await tx.canine.update({
            where: { id: transfer.canineId },
            data: { ownerId: selectedUserId },
          });
        } else if (transfer.litterId) {
          await tx.litter.update({
            where: { id: transfer.litterId },
            data: { ownerId: selectedUserId },
          });

          await tx.canine.updateMany({
            where: { litterId: transfer.litterId },
            data: { ownerId: selectedUserId },
          });
        }

        return {
          success: true,
          message: 'Ownership transferred and request accepted successfully',
        };
      });
    } catch (error: any) {
      this.logger.error(`Approve transfer failed: ${error}`);
      throw new InternalServerErrorException('Failed to process transfer');
    }
  }
  // 4. Decline Transfer
  async declineTransfer(id: string) {
    return await this.prisma.ownershipTransfer.update({
      where: { id },
      data: { status: TransferOwnershipStatus.DECLINE },
    });
  }
}
