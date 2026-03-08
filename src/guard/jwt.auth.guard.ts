/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/main/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isValid = await super.canActivate(context);
    if (!isValid) return false;

    const request = context.switchToHttp().getRequest();
    const userId = request.user.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isVerified: true,
        roleType: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Your account is not verified. Please verify your email.',
      );
    }

    request.userId = user.id;
    request.user = {
      userId: user.id,
      role: user.roleType,
    };

    return true;
  }
}
