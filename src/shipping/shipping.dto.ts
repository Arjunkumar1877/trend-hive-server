import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  FREE = 'free',
}

export class ShippingAddressDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Address line 1', example: '123 Main St' })
  @IsString()
  addressLine1: string;

  @ApiProperty({ description: 'Address line 2', required: false, example: 'Apt 4B' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ description: 'City', example: 'New York' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/Province', example: 'NY' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code', example: '10001' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country', example: 'United States' })
  @IsString()
  country: string;
}

export class CalculateShippingDto {
  @ApiProperty({ description: 'Shipping address', type: ShippingAddressDto })
  address: ShippingAddressDto;

  @ApiProperty({
    description: 'Shipping method',
    enum: ShippingMethod,
    example: ShippingMethod.STANDARD,
  })
  @IsEnum(ShippingMethod)
  method: ShippingMethod;

  @ApiProperty({ description: 'Total weight in kg', example: 2.5, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalWeight?: number;

  @ApiProperty({ description: 'Order subtotal', example: 100.0, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  orderSubtotal?: number;
}

export class ShippingRateDto {
  @ApiProperty()
  method: ShippingMethod;

  @ApiProperty()
  methodName: string;

  @ApiProperty()
  cost: number;

  @ApiProperty()
  estimatedDays: number;

  @ApiProperty()
  currency: string;
}

export class ShippingCalculationResponseDto {
  @ApiProperty({ type: [ShippingRateDto] })
  availableMethods: ShippingRateDto[];

  @ApiProperty()
  selectedMethod: ShippingRateDto;

  @ApiProperty()
  address: ShippingAddressDto;
}

