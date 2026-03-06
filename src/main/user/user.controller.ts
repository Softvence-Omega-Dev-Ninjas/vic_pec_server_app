/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from 'src/guard/jwt.auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered. OTP sent to email.',
  })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  async register(@Body() dto: RegisterUserDto) {
    return this.userService.register(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify email using OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid/Expired OTP or Account Locked.',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.userService.verifyOtp(dto.email, dto.otp);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend verification OTP' })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'user@example.com' } },
    },
  })
  @ApiResponse({ status: 200, description: 'New OTP sent to email.' })
  async resendOtp(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required.');
    return this.userService.resendOtp(email);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive HTTP-only cookie' })
  @ApiResponse({ status: 200, description: 'Login successful, cookie set.' })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email not verified.',
  })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return this.userService.login(loginDto, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User Logout' })
  @ApiResponse({ status: 200, description: 'Cookie cleared successfully.' })
  async logout(@Res() res: Response) {
    return this.userService.logout(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves the profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile data retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access.' })
  async getMe(@Req() req: any) {
    const id = req.userId;

    if (!id) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return this.userService.getMe(id);
  }
}
