/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The unique email address of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description: 'Minimum 6 character password',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Contact phone number',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'New York',
    description: 'City of residence',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State/Province' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Postal or Zip code' })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'USA', description: 'Country of residence' })
  @IsString()
  @IsOptional()
  country?: string;
}
