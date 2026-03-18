// admin-canine/dto/admin-canine.dto.ts
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
import { Gender, RegistryTier, CanineStatus } from 'generated/prisma/enums';

export class AdminCanineQueryDto {
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

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

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

export class UpdateCanineAdminDto {
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
  @Type(() => Number) // এটি খুবই জরুরি
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
