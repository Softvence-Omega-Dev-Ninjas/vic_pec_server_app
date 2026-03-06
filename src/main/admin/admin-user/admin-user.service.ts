/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleType, UserStatus } from 'generated/prisma/enums';
import { MailService } from 'src/main/mail/mail.service';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async createUserByAdmin(dto: CreateUserByAdminDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      const plainPassword =
        dto.password || `pcr${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const prefix = dto.roleType === RoleType.OWNER ? 'OW' : 'PA';

      const lastUser = await this.prisma.user.findFirst({
        where: { pcrPrefix: prefix },
        orderBy: { pcrIncremental: 'desc' },
      });

      const nextIncrementalInt = lastUser
        ? parseInt(lastUser.pcrIncremental) + 1
        : 1;
      const pcrIncremental = nextIncrementalInt.toString().padStart(4, '0');
      const pcrRandom = Math.floor(100000 + Math.random() * 900000).toString();
      const pcrId = `PCR-${prefix}${pcrIncremental}-${pcrRandom}`;

      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          fullName: dto.fullName,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          country: dto.country,
          phoneNumber: dto.phoneNumber,
          roleType: dto.roleType,
          isVerified: false,
          status: UserStatus.ACTIVE,
          pcrId,
          pcrPrefix: prefix,
          pcrIncremental,
          pcrRandom,
        },
      });

      try {
        await this.mailService.sendWelcomeEmail(
          newUser.email,
          newUser.fullName || 'User',
          plainPassword,
        );
      } catch (mailError) {
        this.logger.error('Failed to send welcome email:', mailError);
      }

      const { password, ...result } = newUser;
      return {
        success: true,
        message: 'User created successfully. Credentials sent to email.',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('User creation failed:', error.message);
      throw new InternalServerErrorException(
        error.message || 'Failed to create user',
      );
    }
  }

  async approveUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    if (!user.isVerified) {
      throw new BadRequestException(
        'User email is not verified yet. Admin cannot approve unverified users.',
      );
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    return {
      success: true,
      message: 'User approved and account is now active.',
      data: { id: updatedUser.id, status: updatedUser.status },
    };
  }

  async rejectUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.REJECTED },
    });

    return {
      success: true,
      message: 'User application has been rejected.',
    };
  }

  async suspendUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });

    return {
      success: true,
      message: 'User account has been suspended.',
    };
  }

  async getAllUsers(query: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    isVerified?: boolean;
    search?: string;
  }) {
    const { page = 1, limit = 10, status, isVerified, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (search) {
      where.fullName = { contains: search, mode: 'insensitive' };
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          membership: true,
          profileImage: true,
        },
      }),
    ]);

    const results = users.map(({ password, otp, ...user }) => user);

    return {
      success: true,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: results,
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        membership: true,
        profileImage: true,
        permissions: true,
        canines: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { password, otp, otpExpires, ...result } = user;
    return {
      success: true,
      data: result,
    };
  }
}
