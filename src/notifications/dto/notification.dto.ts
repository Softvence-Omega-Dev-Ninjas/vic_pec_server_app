import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  // IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from 'generated/prisma/enums';

export class CreateNotificationDto {
  receiverId!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsEnum(ResourceType)
  category?: ResourceType;
}

export class QueryNotificationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsUUID()
  receiverId?: string;

  @IsOptional()
  @IsString() // String hishebe nibo (true/false)
  isRead?: string;
}

export class MarkSelectedReadDto {
  @IsUUID('4', { each: true })
  notificationIds!: string[];
}
