import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsEmail,
} from 'class-validator';
import { PriorityLevel, ReportStatus } from 'generated/prisma/enums';

export class CreateReportDto {
  @ApiProperty({ example: 'Incorrect DNA Info' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Fraudulent Activity' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 'Detailed description of the issue...' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ example: 'canine-uuid' })
  @IsOptional()
  @IsUUID()
  canineId?: string;

  @ApiPropertyOptional({ example: 'litter-uuid' })
  @IsOptional()
  @IsUUID()
  litterId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  reporterName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  reporterEmail!: string;
}

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @ApiPropertyOptional({ enum: PriorityLevel })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;
}
