/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../main/prisma/prisma.service';

@Injectable()
export class MembershipLimitGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.userId;

    if (!userId) {
      throw new ForbiddenException('User identification failed.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        membership: {
          select: {
            canineLimit: true,
            tier: true,
          },
        },
        _count: {
          select: { canines: true },
        },
      },
    });

    if (!user || !user.membership) {
      throw new ForbiddenException('No active membership found.');
    }

    if (user._count.canines >= user.membership.canineLimit) {
      throw new ForbiddenException(
        `Your ${user.membership.tier} plan limit reached (${user.membership.canineLimit} canines). Please upgrade.`,
      );
    }

    return true;
  }
}
