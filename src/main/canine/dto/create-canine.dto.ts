import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import {
  Gender,
  RegistrationRequestType,
  VaccinationType,
  HealthClearance,
} from 'generated/prisma/enums';
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

  @ApiProperty({ example: 65.5 })
  @IsNumber()
  @IsNotEmpty()
  weight!: number;

  @ApiProperty({ example: 'uuid-of-breed' })
  @IsString()
  @IsNotEmpty()
  breedId!: string;

  @ApiPropertyOptional({
    example: 'F1',
    description: 'Required if breed type is DESIGNER. Options: F1, F1B, F2, VD',
  })
  @IsOptional()
  @IsString()
  generation?: string;

  @ApiProperty({ example: '900123456789' })
  @IsString()
  @IsNotEmpty()
  microchipId!: string;

  @ApiProperty({ example: 'German Shepherd' })
  @IsNotEmpty()
  @IsString()
  primaryBreedDNA!: string;

  @ApiPropertyOptional({ example: 'Husky' })
  @IsOptional()
  @IsString()
  secondaryBreedDNA?: string;

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

  // Location fields
  @ApiProperty({ example: 'Dallas' }) @IsString() @IsNotEmpty() city!: string;
  @ApiProperty({ example: 'TX' }) @IsString() @IsNotEmpty() state!: string;
  @ApiProperty({ example: '75201' }) @IsString() @IsNotEmpty() zipCode!: string;
  @ApiProperty({ example: 'USA' }) @IsString() @IsNotEmpty() country!: string;

  @ApiPropertyOptional({ enum: RegistrationRequestType })
  @IsOptional()
  @IsEnum(RegistrationRequestType)
  requestType?: RegistrationRequestType;

  // For handling multiple images/files in the service
  @ApiPropertyOptional({ type: 'string', format: 'binary', isArray: true })
  @IsOptional()
  @IsArray()
  images?: any[];

  @ApiPropertyOptional({ type: 'string', format: 'binary', isArray: true })
  @IsOptional()
  @IsArray()
  DNAdocuments?: any[];
}

export class UpdateCanineDto extends PartialType(RegisterCanineDto) {}
