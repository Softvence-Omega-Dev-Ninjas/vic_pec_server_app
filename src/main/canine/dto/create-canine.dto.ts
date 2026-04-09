import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsArray,
  IsNumberString,
  Length,
} from 'class-validator';
import {
  Gender,
  RegistrationRequestType,
  VaccinationType,
  HealthClearance,
} from '../../../../generated/prisma/enums';
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

  // Generation removed as per instruction for individual registration

  @ApiPropertyOptional({
    example: '123456789012345',
    description: '15-digit microchip identification number',
  })
  @IsOptional()
  @IsNumberString({}, { message: 'Microchip ID must contain only numbers' })
  @Length(15, 15, { message: 'Microchip ID must be exactly 15 digits long' })
  microchipId?: string;

  @ApiProperty({ example: 'German Shepherd' })
  @IsNotEmpty()
  @IsString()
  primaryBreedDNA!: string;

  @ApiPropertyOptional({ example: 'Husky' })
  @IsOptional()
  @IsString()
  secondaryBreedDNA?: string;

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

  @ApiProperty({ example: 'Dallas' }) @IsString() @IsNotEmpty() city!: string;
  @ApiProperty({ example: 'TX' }) @IsString() @IsNotEmpty() state!: string;
  @ApiProperty({ example: '75201' }) @IsString() @IsNotEmpty() zipCode!: string;
  @ApiProperty({ example: 'USA' }) @IsString() @IsNotEmpty() country!: string;

  @ApiPropertyOptional({ enum: RegistrationRequestType })
  @IsOptional()
  @IsEnum(RegistrationRequestType)
  requestType?: RegistrationRequestType;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  images?: any[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  DNAdocuments?: any[];
}

export class UpdateCanineDto extends PartialType(RegisterCanineDto) {}
