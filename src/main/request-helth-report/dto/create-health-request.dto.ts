import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UpdateRequestStatusDto {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVOKED = 'REVOKED',
}

export class CreateHealthRequestDto {
  @ApiPropertyOptional({
    description: 'The ID of the canine',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  canineId?: string;

  @ApiPropertyOptional({
    description: 'The ID of the litter',
    example: '661f9511-f30c-52e5-b827-557766551111',
  })
  @IsOptional()
  @IsUUID()
  litterId?: string;

  @ApiPropertyOptional({
    description: 'Optional note for the owner',
    example: 'I would like to see the DNA records for breeding purposes.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateHealthRequestStatusDto {
  @ApiProperty({
    enum: UpdateRequestStatusDto,
    description: 'New status of the request',
  })
  @IsEnum(UpdateRequestStatusDto)
  status!: UpdateRequestStatusDto;
}
