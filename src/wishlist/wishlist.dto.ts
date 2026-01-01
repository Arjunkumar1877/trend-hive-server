import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId } from 'class-validator';

export class AddToWishlistDto {
  @ApiProperty({
    description: 'Product ID to add to wishlist',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsMongoId()
  productId: string;
}

export class WishlistItemDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productPrice: number;

  @ApiProperty()
  productDescription: string;

  @ApiProperty({ required: false })
  productImage?: string;

  @ApiProperty()
  availableQuantity: number;

  @ApiProperty()
  addedAt: Date;
}

export class WishlistResponseDto {
  @ApiProperty()
  wishlistId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: [WishlistItemDto] })
  items: WishlistItemDto[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}

