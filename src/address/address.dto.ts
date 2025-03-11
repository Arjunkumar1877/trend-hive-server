import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateAddressRequestDto {
  @ApiPropertyOptional({ description: 'Street address of the user', example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City of the address', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State of the address', example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP code of the address', example: '10001' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Phone number associated with the address', example: '+1-555-123-4567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Indicates if this is the default address', example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
