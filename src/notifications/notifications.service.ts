/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../main/prisma/prisma.service';
import {
  QueryNotificationDto,
  MarkSelectedReadDto,
} from './dto/notification.dto';
import { RoleType, ResourceType } from '../../generated/prisma/enums';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  // 1. Alert Admins (Only Admin & Super Admin will receive & save)
  async alertAdmins(payload: {
    title: string;
    message: string;
    link?: string;
    category?: ResourceType;
    sourceId?: string;
  }) {
    try {
      // Step 1: Find all Admin and Super Admin IDs
      const admins = await this.prisma.user.findMany({
        where: {
          roleType: { in: [RoleType.ADMIN, RoleType.SUPER_ADMIN] },
        },
        select: { id: true },
      });

      if (admins.length === 0) {
        return { success: true, message: 'No admins to notify' };
      }

      // Step 2: Prepare Bulk Data for Persistence (Each admin gets a copy)
      const notificationData = admins.map((admin) => ({
        receiverId: admin.id,
        title: payload.title,
        message: payload.message,
        link: payload.link,
        sourceId: payload.sourceId,
        category: payload.category || null,
      }));

      // Step 3: Database-e Save kora (createMany use kora hoyeche efficiency-r jonno)
      await this.prisma.notification.createMany({
        data: notificationData,
      });

      // Step 4: Socket-er maddhome Real-time Alert pathano (Only for admins)
      if (this.gateway) {
        admins.forEach((admin) => {
          this.gateway.sendToUser(admin.id, {
            ...payload,
            isAdminAlert: true,
            createdAt: new Date(),
          });
        });
      }

      return { success: true, message: 'Admins notified and history saved' };
    } catch (error) {
      console.error('Admin Alert Error:', error);
      // System crash jate na hoy tai error return kora hoyeche, throw noy
      return { success: false, error: 'Failed to alert admins' };
    }
  }

  // 2. Get All Notifications (Strictly filtered for logged-in Admin/Super Admin)
  async findAll(query: QueryNotificationDto, currentUserId: string) {
    try {
      // Role validation (Security Check)

      const user = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: { roleType: true },
      });
      if (!user) {
        throw new BadRequestException('You have to loged in!');
      }
      const allowedRoles: RoleType[] = [RoleType.ADMIN, RoleType.SUPER_ADMIN];
      if (!allowedRoles.includes(user.roleType)) {
        throw new BadRequestException(
          'Access denied. Only admins can view these notifications.',
        );
      }

      const { page = 1, limit = 10, searchTerm, isRead } = query;
      const skip = (Number(page) - 1) * Number(limit);

      // Building the dynamic filter
      const where: any = {
        receiverId: currentUserId, // Prityti Admin shudhu tar notification dekhbe
      };

      // boolean filter fix: strictly check for undefined
      if (isRead === 'true') {
        where.isRead = true;
      } else if (isRead === 'false') {
        where.isRead = false;
      }

      if (searchTerm) {
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { message: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      // Parallel execution for speed
      const [data, total] = await this.prisma.$transaction([
        this.prisma.notification.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            receiver: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.notification.count({ where }),
      ]);

      return {
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPage: Math.ceil(total / Number(limit)),
        },
        data,
      };
    } catch (error) {
      console.error('FindAll Notifications Error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Notification fetching failed');
    }
  }

  // 3. Get Single Notification
  async findOne(id: string) {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException(
          `Notification (ID: ${id}) khuje pawa jayni`,
        );
      }

      // Auto mark as read when viewed
      if (!notification.isRead) {
        return await this.prisma.notification.update({
          where: { id },
          data: { isRead: true },
        });
      }

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Notification details ante somossa hoyeche',
      );
    }
  }

  // 4. Mark Single as Read
  async markAsRead(id: string) {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Update korar moto notification pawa jayni',
        );
      }
      throw new InternalServerErrorException('Read mark korte somossa hoyeche');
    }
  }

  // 5. Read All for an Admin
  async markAllAsRead(receiverId: string) {
    if (!receiverId) throw new BadRequestException('Admin ID proyojon');

    try {
      return await this.prisma.notification.updateMany({
        where: { receiverId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Bulk update failed');
    }
  }

  // 6. Mark Selected IDs as Read
  async markSelectedAsRead(payload: MarkSelectedReadDto) {
    if (!payload.notificationIds?.length) {
      throw new BadRequestException('Kono ID deya hoyni');
    }

    try {
      return await this.prisma.notification.updateMany({
        where: {
          id: { in: payload.notificationIds },
        },
        data: { isRead: true },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Selected update failed');
    }
  }

  // 7. Delete Notification
  async remove(id: string) {
    try {
      return await this.prisma.notification.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          'Delete korar moto notification pawa jayni',
        );
      }
      throw new InternalServerErrorException('Delete failed');
    }
  }

  // 8. Clear All Notifications for Current Admin
  async removeAllForUser(receiverId: string) {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: { receiverId },
      });
      return {
        message: 'Sob notification muche fela hoyeche',
        count: result.count,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Clear all failed');
    }
  }
}
