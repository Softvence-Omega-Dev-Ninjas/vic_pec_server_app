import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransferOwnershipStatus } from 'generated/prisma/enums';

// ১. ট্রান্সফার রিকোয়েস্ট তৈরি করার DTO
export class CreateTransferDto {
  @ApiPropertyOptional({ example: 'canine-uuid-here' })
  @IsOptional()
  @IsUUID()
  canineId?: string;

  @ApiPropertyOptional({ example: 'litter-uuid-here' })
  @IsOptional()
  @IsUUID()
  litterId?: string;
}

export class ClaimTransferDto {
  @ApiProperty({ example: 'TRF-123456' })
  @IsString()
  @IsNotEmpty()
  transferCode!: string;
}

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

  @ApiPropertyOptional({
    example: 'sent',
    description: 'Values: sent or received',
  })
  @IsOptional()
  @IsString()
  direction?: 'sent' | 'received';
}
