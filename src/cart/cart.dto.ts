import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID to add to cart',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsMongoId()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Variant ID (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Product ID in the cart',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsMongoId()
  productId: string;

  @ApiProperty({
    description: 'New quantity for the product',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Variant ID (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class RemoveFromCartDto {
  @ApiProperty({
    description: 'Product ID to remove from cart',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsMongoId()
  productId: string;

  @ApiProperty({
    description: 'Variant ID (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class CartItemResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productPrice: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty({ required: false })
  productImage?: string;

  @ApiProperty({ required: false })
  variantId?: string;

  @ApiProperty({ required: false })
  variantName?: string; // e.g. "L / Red"
}

export class CartResponseDto {
  @ApiProperty()
  cartId: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}

