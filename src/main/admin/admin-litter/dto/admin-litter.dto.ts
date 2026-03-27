import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsIn,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CanineStatus, RegistryTier } from 'generated/prisma/enums';

export class AdminLitterQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Search by name, pcrId, or microchipId' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RegistryTier })
  @IsOptional()
  @IsEnum(RegistryTier)
  tier?: RegistryTier;

  @ApiPropertyOptional({ enum: CanineStatus })
  @IsOptional()
  @IsEnum(CanineStatus)
  status?: CanineStatus;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}

export class UpdateLitterAdminDto {
  @ApiPropertyOptional({ example: 'Golden Guardians Litter A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: CanineStatus,
    description: 'Change status for litter and all puppies',
  })
  @IsOptional()
  @IsEnum(CanineStatus)
  status?: CanineStatus;

  @ApiPropertyOptional({
    enum: RegistryTier,
    description: 'Change tier for litter and all puppies',
  })
  @IsOptional()
  @IsEnum(RegistryTier)
  tier?: RegistryTier;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Excellent' })
  @IsOptional()
  @IsString()
  healthStatus?: string;

  // Location fields update korar option thaka bhalo
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;
  @ApiProperty({ example: 'USA' }) @IsString() @IsNotEmpty() country!: string;
}
