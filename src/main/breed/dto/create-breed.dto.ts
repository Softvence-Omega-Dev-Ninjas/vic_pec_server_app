import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBreedDto {
  @ApiProperty({ example: '301' })
  @IsString()
  @IsNotEmpty()
  breedCode!: string;

  @ApiProperty({ example: 'Labradoodle' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'LBD' })
  @IsString()
  @IsNotEmpty()
  acronym!: string;

  @ApiProperty({ example: 'DESIGNER' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ example: 'Gold - Auto Eligible' })
  @IsOptional()
  @IsString()
  tierEligibility?: string;

  @ApiPropertyOptional({ example: 'F1, F1B' })
  @IsOptional()
  @IsString()
  eligibleGen?: string;
}

export class UpdateBreedDto extends CreateBreedDto {}
