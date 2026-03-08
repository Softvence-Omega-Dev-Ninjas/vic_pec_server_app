/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  ChangePasswordDto,
  UpdateProfileDto,
  UpdateSettingsDto,
} from './dto/user-profile.dto';
import { UserService } from '../user.service';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      return await this.prisma.user.update({
        where: { id: userId },
        data: { ...dto },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          about: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          updatedAt: true,
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Profile update failed for user ${userId}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'An unexpected error occurred while updating profile',
      );
    }
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    try {
      if (Object.keys(dto).length === 0) {
        throw new BadRequestException('No settings provided to update');
      }

      return await this.prisma.user.update({
        where: { id: userId },
        data: { ...dto },
        select: {
          emailNotifications: true,
          showOwnerId: true,
          updatedAt: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025')
        throw new NotFoundException('User settings not found');
      throw new InternalServerErrorException('Failed to update user settings');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) throw new NotFoundException('User not found');

      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException(
          'The current password you entered is incorrect',
        );
      }

      const isSameAsOld = await bcrypt.compare(dto.newPassword, user.password);
      if (isSameAsOld) {
        throw new BadRequestException(
          'New password cannot be the same as your old password',
        );
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: 'Your password has been changed successfully',
      };
    } catch (error: any) {
      this.logger.error(
        `Password change failed for user ${userId}: ${error.message}`,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Could not update password at this time',
      );
    }
  }
}
