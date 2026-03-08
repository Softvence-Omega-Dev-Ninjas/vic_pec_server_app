/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { ResourceType, RoleType } from 'generated/prisma/enums';
import { PermissionDto } from './dto/permission.dto';
import { PermissionPaginationDto } from './dto/permission-query.dto';

export enum PermissionAction {
  VIEW = 'canView',
  CREATE = 'canCreate',
  EDIT = 'canEdit',
  DELETE = 'canDelete',
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private prisma: PrismaService) {}

  // ---------------- CREATE SINGLE PERMISSION ----------------

  async createPermission(adminId: string, dto: PermissionDto) {
    try {
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
      });

      if (!admin) throw new NotFoundException('Admin user not found');

      if (admin.roleType !== RoleType.ADMIN) {
        throw new BadRequestException(
          'Permissions can only be assigned to ADMIN users',
        );
      }

      const existing = await this.prisma.accessPermission.findUnique({
        where: {
          userId_resource: {
            userId: adminId,
            resource: dto.resource,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Permission for ${dto.resource} already exists`,
        );
      }

      return await this.prisma.accessPermission.create({
        data: {
          userId: adminId,
          resource: dto.resource,
          canView: dto.canView ?? false,
          canCreate: dto.canCreate ?? false,
          canEdit: dto.canEdit ?? false,
          canDelete: dto.canDelete ?? false,
        },
      });
    } catch (error: any) {
      this.logger.error(`Create permission error`, error.stack);

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create permission');
    }
  }

  // ---------------- SYNC ADMIN PERMISSIONS ----------------

  async updateAdminPermissions(adminId: string, permissions: PermissionDto[]) {
    try {
      if (!permissions || permissions.length === 0) {
        throw new BadRequestException('Permission list cannot be empty');
      }

      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
      });

      if (!admin) throw new NotFoundException('Admin user not found');

      if (admin.roleType !== RoleType.ADMIN) {
        throw new BadRequestException(
          'Permissions can only be updated for ADMIN users',
        );
      }

      // Duplicate resource check
      const resources = permissions.map((p) => p.resource);
      const uniqueResources = new Set(resources);

      if (resources.length !== uniqueResources.size) {
        throw new ConflictException('Duplicate resource detected');
      }

      return await this.prisma.$transaction(async (tx) => {
        await tx.accessPermission.deleteMany({
          where: { userId: adminId },
        });

        const data = permissions.map((p) => ({
          userId: adminId,
          resource: p.resource,
          canView: p.canView ?? false,
          canCreate: p.canCreate ?? false,
          canEdit: p.canEdit ?? false,
          canDelete: p.canDelete ?? false,
        }));

        await tx.accessPermission.createMany({
          data,
        });

        return {
          success: true,
          message: 'Permissions synchronized successfully',
        };
      });
    } catch (error: any) {
      this.logger.error(`Permission sync failed`, error.stack);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update permissions');
    }
  }

  // ---------------- CHECK ACCESS ----------------

  async hasAccess(
    userId: string,
    resource: ResourceType,
    action: PermissionAction,
  ): Promise<boolean> {
    const permission = await this.prisma.accessPermission.findUnique({
      where: {
        userId_resource: {
          userId,
          resource,
        },
      },
    });

    if (!permission) return false;

    return permission[action] === true;
  }

  // ---------------- GET ADMINS WITH PERMISSIONS ----------------

  async getAllAdminsWithPermissions(query: PermissionPaginationDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);

    const skip = (page - 1) * limit;

    const where = {
      roleType: RoleType.ADMIN,
      ...(query.search && {
        OR: [
          {
            fullName: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          },
          {
            email: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),

      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          permissions: {
            select: {
              resource: true,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
          },
        },
      }),
    ]);

    return {
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
      data,
    };
  }

  // ---------------- DELETE PERMISSION ----------------

  async deleteResourcePermission(adminId: string, resource: ResourceType) {
    try {
      const permission = await this.prisma.accessPermission.findUnique({
        where: {
          userId_resource: {
            userId: adminId,
            resource,
          },
        },
      });

      if (!permission) {
        throw new NotFoundException(`Permission for ${resource} not found`);
      }

      await this.prisma.accessPermission.delete({
        where: {
          userId_resource: {
            userId: adminId,
            resource,
          },
        },
      });

      return {
        success: true,
        message: `Permission removed for ${resource}`,
      };
    } catch (error: any) {
      this.logger.error(`Delete permission failed`, error.stack);
      throw error;
    }
  }
}
