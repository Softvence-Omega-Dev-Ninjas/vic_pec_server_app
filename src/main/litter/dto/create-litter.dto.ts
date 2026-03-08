import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Gender } from 'generated/prisma/enums';
import { PartialType } from '@nestjs/swagger';

export class CreateLitterDto {
  @ApiProperty({ example: '301' })
  @IsString()
  @IsNotEmpty()
  pcrBreedCode!: string;

  @ApiProperty({ example: 'F1B' })
  @IsString()
  @IsNotEmpty()
  generation!: string;

  @ApiProperty({ example: 'Litter 01 - Golden Retriever' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: '2024-03-08' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth!: string;

  @ApiProperty({ example: 'Creamy White' })
  @IsString()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({ example: 12.5 }) // Now Required
  @IsNumber()
  @IsNotEmpty()
  weight!: number;

  @ApiProperty({ example: 'Dallas' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'TX' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: '75201' })
  @IsString()
  @IsNotEmpty()
  zipCode!: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ example: 'breed-uuid-here' })
  @IsString()
  @IsNotEmpty()
  breedId!: string;

  @ApiProperty({ example: 'MC-123456789' }) // Now Required
  @IsString()
  @IsNotEmpty()
  microchipId!: string;

  @ApiPropertyOptional({ example: 'PCR-G301-00001-123456' })
  @IsOptional()
  @IsString()
  motherPcrId?: string;

  @ApiPropertyOptional({ example: 'PCR-B301-00005-654321' })
  @IsOptional()
  @IsString()
  fatherPcrId?: string;
}

export class UpdateLitterDto extends PartialType(CreateLitterDto) {}
