import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { DiscountType } from '../data/schemas/coupon.schema';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER2025' })
  @IsString()
  code: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 10, description: 'Percentage or Fixed Amount' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: '2025-12-31T23:59:59.999Z' })
  @IsDateString()
  expirationDate: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;
  
  @ApiProperty({ required: false, example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;
}

export class UpdateCouponDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false, enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;
  
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'SUMMER2025' })
  @IsString()
  code: string;
  
  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  orderTotal: number;
}
