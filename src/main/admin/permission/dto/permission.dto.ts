import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ResourceType } from 'generated/prisma/enums';

export class PermissionDto {
  @ApiProperty({
    enum: ResourceType,
    example: ResourceType.USER,
    description: 'The specific module/resource name',
  })
  @IsEnum(ResourceType)
  @IsNotEmpty()
  resource!: ResourceType;

  @ApiProperty({ default: false, example: true })
  @IsBoolean()
  canView: boolean = false;

  @ApiProperty({ default: false, example: false })
  @IsBoolean()
  canCreate: boolean = false;

  @ApiProperty({ default: false, example: true })
  @IsBoolean()
  canEdit: boolean = false;

  @ApiProperty({ default: false, example: false })
  @IsBoolean()
  canDelete: boolean = false;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  canView?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;
}
