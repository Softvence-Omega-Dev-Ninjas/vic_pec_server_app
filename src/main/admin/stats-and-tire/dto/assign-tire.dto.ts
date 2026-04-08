// update-tier.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RegistryTier } from '../../../../../generated/prisma/enums';

export class UpdateRegistryTierDto {
  @ApiProperty({
    enum: RegistryTier,
    example: RegistryTier.GOLD,
    description: 'Select the tier for the canine or litter',
  })
  @IsEnum(RegistryTier)
  @IsNotEmpty()
  tier!: RegistryTier;
}
