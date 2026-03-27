import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({ example: 'PRESTIGE' })
  @IsString()
  @IsNotEmpty()
  tier!: string;

  @ApiProperty({ example: 'Prestige Ambassador' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  currentPrice!: number;

  @ApiProperty({ example: 7 })
  @IsNumber()
  @Min(1)
  canineLimit!: number;

  @ApiProperty({
    example: ['Seven (7) Canine Registrations', 'Direct PA Assistance'],
  })
  @IsArray()
  @IsString({ each: true })
  features: string[] = [];

  // --- Base Prices for Services ---
  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  canineRegPrice!: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  litterRegPrice!: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  transferPrice!: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0)
  certificatePrice!: number;

  // --- Discount Percentages (0.0 to 1.0) ---
  @ApiProperty({ example: 0.3, description: '0.3 means 30% off' })
  @IsNumber()
  @Min(0)
  @Max(1)
  canineRegDiscount: number = 0;

  @ApiProperty({ example: 1.0, description: '1.0 means 100% off (Free)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  litterRegDiscount: number = 0;

  @IsNumber()
  @Min(0)
  @Max(1)
  transferDiscount: number = 0;

  @IsNumber()
  @Min(0)
  @Max(1)
  certificateDiscount: number = 0;
}
export class UpdateMembershipDto {
  @ApiPropertyOptional({ example: 'Updated Prestige Plan' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 199.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  canineLimit?: number;

  @ApiPropertyOptional({ example: ['Updated Feature 1', 'Priority Support'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  // --- Optional Base Price Updates ---
  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  canineRegPrice?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  litterRegPrice?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transferPrice?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  certificatePrice?: number;

  // --- Optional Discount Updates (0.0 to 1.0) ---
  @ApiPropertyOptional({ example: 0.5, description: '50% discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  canineRegDiscount?: number;

  @ApiPropertyOptional({ example: 0.2, description: '20% discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  litterRegDiscount?: number;

  @ApiPropertyOptional({ example: 0.1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  transferDiscount?: number;

  @ApiPropertyOptional({ example: 1.0, description: '100% discount (Free)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  certificateDiscount?: number;
}
