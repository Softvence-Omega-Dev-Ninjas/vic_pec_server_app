import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  //   IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CertificateRequestStatus } from '../../../../../generated/prisma/enums';

export class CreateCertificateRequestDto {
  @ApiProperty({ example: 'canine-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  canineId?: string;

  @ApiProperty({ example: 'litter-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  litterId?: string;

  @ApiProperty({
    example: 'Need this for the upcoming dog show.',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}

export class CertificateQueryDto {
  @ApiPropertyOptional({ enum: CertificateRequestStatus })
  @IsEnum(CertificateRequestStatus)
  @IsOptional()
  status?: CertificateRequestStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}
