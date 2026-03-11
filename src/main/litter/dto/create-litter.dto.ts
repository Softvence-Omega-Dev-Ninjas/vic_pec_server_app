import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
} from 'class-validator';
import {
  Gender,
  HealthClearance,
  RegistrationRequestType,
  VaccinationType,
} from 'generated/prisma/enums';
import { PartialType } from '@nestjs/swagger';

export class CreateLitterDto {
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

  @ApiProperty({ example: 12.5 })
  @IsNumber()
  @IsNotEmpty()
  weight!: number;

  @ApiProperty({ example: 'breed-uuid-here' })
  @IsString()
  @IsNotEmpty()
  breedId!: string;

  @ApiProperty({ example: 'F1', description: 'Required for Designer breeds' })
  @IsString()
  @IsNotEmpty()
  generation!: string;

  @ApiProperty({ example: 'MC-123456789' })
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

  // New Health Related Fields
  @ApiPropertyOptional({ example: 'Excellent' })
  @IsOptional()
  @IsString()
  healthStatus?: string;

  @ApiPropertyOptional({ enum: VaccinationType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(VaccinationType, { each: true })
  vaccinations?: VaccinationType[];

  @ApiPropertyOptional({ enum: HealthClearance, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(HealthClearance, { each: true })
  healthClearances?: HealthClearance[];

  @ApiPropertyOptional({ example: 'Any additional health information...' })
  @IsOptional()
  @IsString()
  healthNotes?: string;

  // Location data
  @ApiProperty({ example: 'Dallas' }) @IsString() @IsNotEmpty() city!: string;
  @ApiProperty({ example: 'TX' }) @IsString() @IsNotEmpty() state!: string;
  @ApiProperty({ example: '75201' }) @IsString() @IsNotEmpty() zipCode!: string;
  @ApiProperty({ example: 'USA' }) @IsString() @IsNotEmpty() country!: string;

  // @ApiProperty({ example: 'German Shepherd' })
  // @IsNotEmpty()
  // @IsString()
  // primaryBreedDNA!: string;

  // @ApiPropertyOptional({ example: 'Husky' })
  // @IsOptional()
  // @IsString()
  // secondaryBreedDNA?: string;

  @ApiPropertyOptional({ enum: RegistrationRequestType })
  @IsOptional()
  @IsEnum(RegistrationRequestType)
  requestType?: RegistrationRequestType;
}

export class UpdateLitterDto extends PartialType(CreateLitterDto) {}
