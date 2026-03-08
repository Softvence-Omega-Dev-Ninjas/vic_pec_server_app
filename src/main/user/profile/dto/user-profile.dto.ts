import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Contact number',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'I am a professional breeder.',
    description: 'Short bio',
  })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'Current city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State or Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Postal code' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'USA', description: 'Country name' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPass123!',
    description: 'Current password for verification',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  oldPassword!: string;

  @ApiProperty({
    example: 'NewPass456!',
    description: 'New secure password',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: true, description: 'Toggle email alerts' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Allow others to see PCR ID',
  })
  @IsOptional()
  @IsBoolean()
  showOwnerId?: boolean;
}
