import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Gender, RegistrationRequestType } from 'generated/prisma/enums';
import { PartialType } from '@nestjs/swagger';

export class RegisterCanineDto {
  @ApiProperty({ example: 'Maximus' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ example: 'Black and Tan' })
  @IsString()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({ example: 65.5 }) // Required as per your request
  @IsNumber()
  @IsNotEmpty()
  weight!: number;

  @ApiProperty({ example: '301' })
  @IsString()
  @IsNotEmpty()
  pcrBreedCode!: string;

  @ApiProperty({ example: 'G' })
  @IsString()
  @IsNotEmpty()
  pcrPrefix!: string; // 'G' or 'B'

  @ApiPropertyOptional({ example: 'F1' })
  @IsOptional()
  @IsString()
  generation?: string;

  @ApiProperty({ example: 'uuid-of-breed' })
  @IsString()
  @IsNotEmpty()
  breedId!: string;

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

  @ApiProperty({ example: '900123456789' }) // Required as per your request
  @IsString()
  @IsNotEmpty()
  microchipId!: string;

  @ApiPropertyOptional({ example: 'German Shepherd' })
  @IsNotEmpty()
  @IsString()
  primaryBreedDNA!: string;

  @ApiPropertyOptional({ example: 'Husky' })
  @IsOptional()
  @IsString()
  secondaryBreedDNA?: string;

  @ApiPropertyOptional({ enum: RegistrationRequestType })
  @IsOptional()
  @IsEnum(RegistrationRequestType)
  requestType?: RegistrationRequestType;
}

export class UpdateCanineDto extends PartialType(RegisterCanineDto) {}
