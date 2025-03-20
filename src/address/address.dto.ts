import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateAddressRequestDto {
  @ApiPropertyOptional({ description: 'Street address of the user', example: '123 Main St' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ description: 'City of the user', example: 'New York' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'State of the user', example: 'NY' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ description: 'ZIP code of the user', example: '10001' })
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({ description: 'country of the user', example: 'India' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Phone number associated with the user', example: '+1-555-123-4567' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Indicates if this is the default user', example: true })
  @IsBoolean()
  isDefault: boolean;
}
