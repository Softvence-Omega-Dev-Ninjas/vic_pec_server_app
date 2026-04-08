/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Patch,
  Body,
  Req,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { UserProfileService } from './user-profile.service';
import {
  ChangePasswordDto,
  UpdateProfileDto,
  UpdateSettingsDto,
} from './dto/user-profile.dto';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../guard/jwt.auth.guard';

@ApiTags('User Profile & Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Patch('me/profile')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profileImage', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
  )
  async updateProfile(
    @Req() req: any,
    @Body() dto: UpdateProfileDto, // Ekhane @Body() text fields gulo ke parse korbe
    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    },
  ) {
    return this.userProfileService.updateProfile(req.userId, dto, files);
  }

  @Patch('me/settings')
  @ApiOperation({
    summary: 'Update your account settings (notifications, visibility)',
  })
  async updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return await this.userProfileService.updateSettings(req.userId, dto);
  }

  @Patch('me/change-password')
  @ApiOperation({ summary: 'Securely change your account password' })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return await this.userProfileService.changePassword(req.userId, dto);
  }
}
