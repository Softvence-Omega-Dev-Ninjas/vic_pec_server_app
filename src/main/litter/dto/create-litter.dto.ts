import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CanineStatus,
  Gender,
  HealthClearance,
  RegistryTier,
  VaccinationType,
} from 'generated/prisma/enums';
import { PartialType } from '@nestjs/swagger';

export class PuppyDetailDto {
  @ApiProperty({ example: 'Puppy Alpha' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: 'Golden Brown' })
  @IsString()
  @IsNotEmpty()
  color!: string;

  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @IsNotEmpty()
  weight!: number;

  @ApiPropertyOptional({ example: 'MC-999000111' })
  @IsOptional()
  @IsString()
  microchipId?: string;
}

export class CreateLitterDto {
  @ApiProperty({ example: 'Golden Winter 2024' })
  @IsString()
  @IsNotEmpty()
  litterName!: string;

  @ApiProperty({ example: '2024-03-08' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth!: string;

  @ApiProperty({ example: 'breed-uuid-here' })
  @IsString()
  @IsNotEmpty()
  breedId!: string;

  @ApiPropertyOptional({ example: 'PCR-G301-00001-123456' })
  @IsOptional()
  @IsString()
  motherPcrId?: string;

  @ApiPropertyOptional({ example: 'PCR-B301-00005-654321' })
  @IsOptional()
  @IsString()
  fatherPcrId?: string;

  // Multi-Puppy Support
  @ApiProperty({
    type: [PuppyDetailDto],
    description: 'List of all puppies in this litter',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PuppyDetailDto)
  puppies!: PuppyDetailDto[];

  // Common Health (Litter level)
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

  @ApiPropertyOptional({ example: 'Litter health notes...' })
  @IsOptional()
  @IsString()
  healthNotes?: string;

  // Common Location
  @ApiProperty({ example: 'Dallas' }) @IsString() @IsNotEmpty() city!: string;
  @ApiProperty({ example: 'TX' }) @IsString() @IsNotEmpty() state!: string;
  @ApiProperty({ example: '75201' }) @IsString() @IsNotEmpty() zipCode!: string;
  @ApiProperty({ example: 'USA' }) @IsString() @IsNotEmpty() country!: string;

  // Media (Swagger UI Support)
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Litter Group Photos',
  })
  @IsOptional()
  images?: any[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'DNA/Pedigree Docs',
  })
  @IsOptional()
  DNAdocuments?: any[];
}

export class UpdateLitterDto extends PartialType(CreateLitterDto) {
  @ApiPropertyOptional({ enum: CanineStatus })
  @IsOptional()
  @IsEnum(CanineStatus)
  status?: CanineStatus;

  @ApiPropertyOptional({ enum: RegistryTier })
  @IsOptional()
  @IsEnum(RegistryTier)
  tier?: RegistryTier;
}
