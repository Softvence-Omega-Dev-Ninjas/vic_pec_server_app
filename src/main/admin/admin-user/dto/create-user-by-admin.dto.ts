/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { RoleType } from 'generated/prisma/enums';

export class CreateUserByAdminDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'securePass123' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ enum: RoleType, example: RoleType.OWNER })
  @IsEnum(RoleType)
  @IsNotEmpty()
  roleType!: RoleType;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @IsOptional() // City optional
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsString()
  @IsOptional() // State optional
  state?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsString()
  @IsOptional() // ZipCode optional
  zipCode?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsString()
  @IsOptional() // Country optional
  country?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
