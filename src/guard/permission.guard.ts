/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PermissionService,
  PermissionAction,
} from 'src/main/admin/permission/permission.service';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { ResourceType } from 'generated/prisma/enums';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const check = this.reflector.getAllAndOverride<{
      resource: ResourceType;
      action: PermissionAction;
    }>('check_permission', [context.getHandler(), context.getClass()]);

    if (!check) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.userId;

    if (userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        roleType: true,
        isVerified: true,
      },
    });

    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    if (dbUser.status !== 'ACTIVE') {
      throw new ForbiddenException('Your account is not active');
    }

    if (!dbUser.isVerified) {
      throw new ForbiddenException('Your account is not verified');
    }

    // SUPER ADMIN bypass
    if (dbUser.roleType === 'SUPER_ADMIN') {
      return true;
    }

    const hasAccess = await this.permissionService.hasAccess(
      dbUser.id,
      check.resource,
      check.action,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied: '${check.action}' permission required on '${check.resource}'`,
      );
    }

    return true;
  }
}
