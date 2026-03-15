import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransferOwnershipStatus } from 'generated/prisma/enums';

export class TransferQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: TransferOwnershipStatus })
  @IsOptional()
  @IsEnum(TransferOwnershipStatus)
  status?: TransferOwnershipStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['sent', 'received', 'all'] })
  @IsOptional()
  @IsString()
  direction?: 'sent' | 'received' | 'all' = 'all';
}
