import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({
    example: 'uuid-of-membership-plan',
    description: 'The ID of the plan the user wants to buy',
  })
  @IsString()
  @IsNotEmpty()
  membershipId!: string;
}
