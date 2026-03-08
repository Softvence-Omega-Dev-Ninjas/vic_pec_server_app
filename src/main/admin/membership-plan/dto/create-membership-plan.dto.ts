import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({
    example: 'PRESTIGE',
    description: 'Unique identifier for the tier',
  })
  @IsString()
  @IsNotEmpty()
  tier!: string;

  @ApiProperty({
    example: 'Prestige Ambassador',
    description: 'Display name of the plan',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 150, description: 'Price of the membership' })
  @IsNumber()
  @Min(0)
  currentPrice!: number;

  @ApiProperty({
    example: 'price_1Q...',
    description: 'Stripe Price ID from Dashboard',
  })
  @IsString()
  @IsNotEmpty()
  stripePriceId!: string;

  @ApiProperty({
    example: 7,
    description: 'Maximum canine registrations allowed',
  })
  @IsNumber()
  @Min(1)
  canineLimit!: number;

  @ApiProperty({
    example: ['Seven (7) Canine Registrations', 'Direct PA Assistance'],
    description: 'Dynamic features list shown on the UI',
  })
  @IsArray()
  @IsString({ each: true })
  features: string[] = [];
}

// প্ল্যান আপডেটের জন্য DTO
export class UpdateMembershipDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  canineLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
