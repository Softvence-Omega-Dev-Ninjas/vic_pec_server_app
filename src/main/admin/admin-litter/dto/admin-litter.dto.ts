/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CanineStatus, Gender, RegistryTier } from 'generated/prisma/enums';

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
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: CanineStatus })
  @IsOptional()
  @IsEnum(CanineStatus)
  status?: CanineStatus;

  @ApiPropertyOptional({ enum: RegistryTier })
  @IsOptional()
  @IsEnum(RegistryTier)
  tier?: RegistryTier;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  healthStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  microchipId?: string;
}
