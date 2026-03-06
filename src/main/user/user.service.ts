/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser)
      throw new ConflictException('This email is already registered.');

    // PCR ID Generation
    const pcrPrefix = 'OW';
    const userCount = await this.prisma.user.count({ where: { pcrPrefix } });
    const pcrIncremental = (userCount + 1).toString().padStart(4, '0');
    const pcrRandom = Math.floor(100000 + Math.random() * 900000).toString();
    const pcrId = `PCR-${pcrPrefix}${pcrIncremental}-${pcrRandom}`;

    // Security: OTP Logic
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins validity

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        pcrId,
        pcrPrefix,
        pcrIncremental,
        pcrRandom,
        otp,
        otpExpires,
        status: 'PENDING',
        isVerified: false,
        membershipId: null, // Membership is optional at registration
        otpAttempts: 0,
      },
    });

    // Send OTP via Email
    await this.mailService.sendOtpEmail(user.email, otp);

    const { password, otp: _, ...result } = user;
    return {
      success: true,
      message:
        'Registration successful. A verification code has been sent to your email.',
      data: result,
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new NotFoundException('User not found.');

    // Check if account is locked
    if (user.otpLockUntil && user.otpLockUntil > new Date()) {
      const waitTime = Math.ceil(
        (user.otpLockUntil.getTime() - Date.now()) / 60000,
      );
      throw new BadRequestException(
        `Too many failed attempts. Please try again after ${waitTime} minutes.`,
      );
    }

    // Check OTP expiration
    if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
      throw new BadRequestException(
        'OTP has expired or is invalid. Please request a new one.',
      );
    }

    // Match OTP
    if (user.otp !== otp) {
      const newAttempts = (user.otpAttempts || 0) + 1;
      const isLocking = newAttempts >= 5;

      await this.prisma.user.update({
        where: { email },
        data: {
          otpAttempts: newAttempts,
          otpLockUntil: isLocking
            ? new Date(Date.now() + 30 * 60 * 1000) // Locked for 30 minutes
            : null,
        },
      });

      const remaining = 5 - newAttempts;
      throw new BadRequestException(
        isLocking
          ? 'Too many failed attempts. Account locked for 30 minutes.'
          : `Invalid OTP. You have ${remaining} attempts remaining.`,
      );
    }

    // Mark as verified and clean security fields
    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpires: null,
        otpAttempts: 0,
        otpLockUntil: null,
      },
    });

    return {
      success: true,
      message: 'Email verified successfully! You can now login.',
    };
  }

  async login(loginDto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please verify your account first before logging in.',
      );
    }

    const payload = { userId: user.id };

    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'super-secret-key',
      expiresIn: '7d',
    });

    // Set secure HTTP-only cookie
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return res.send({
      success: true,
      message: 'Login successful',
      user: {
        email: user.email,
        fullName: user.fullName,
        pcrId: user.pcrId,
      },
    });
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found.');

    // Rate limiting: 1 request per minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (user.updatedAt > oneMinuteAgo) {
      throw new BadRequestException(
        'Please wait 1 minute before requesting another OTP.',
      );
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: {
        otp: newOtp,
        otpExpires: expiresAt,
        otpAttempts: 0,
        otpLockUntil: null,
      },
    });

    await this.mailService.sendOtpEmail(email, newOtp);
    return {
      success: true,
      message: 'A new verification code has been sent to your email.',
    };
  }

  async logout(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    return res.status(200).send({
      success: true,
      message: 'Successfully logged out and session cleared.',
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        membership: true,
        profileImage: true,
        permissions: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const { password, otp, otpExpires, otpAttempts, otpLockUntil, ...result } =
      user;

    return {
      success: true,
      data: result,
    };
  }
}
