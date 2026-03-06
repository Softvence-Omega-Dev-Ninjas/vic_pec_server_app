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
import { PrismaService } from 'src/main/prisma/prisma.service';
import { RoleType, UserStatus } from 'generated/prisma/enums';
import { ROLES_KEY } from 'src/decorator/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();

    const userId = request.user?.userId || request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roleType: true, isVerified: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.roleType === RoleType.SUPER_ADMIN) {
      return true;
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email first.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        `Your account is ${user.status}. Access denied.`,
      );
    }

    if (!requiredRoles) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.roleType);
    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}
