import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Product ID to review',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Rating (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Great product! Highly recommend.',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  comment: string;
}

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Updated rating (1-5 stars)',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({
    description: 'Updated review comment',
    example: 'Good product overall.',
    maxLength: 1000,
    required: false,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  comment?: string;
}

export class AdminReviewResponseDto {
  @ApiProperty({
    description: 'Admin response to the review',
    example: 'Thank you for your feedback!',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  adminResponse: string;
}

export class ApproveReviewDto {
  @ApiProperty({
    description: 'Approval status',
    example: true,
  })
  @IsBoolean()
  isApproved: boolean;
}

export class ReviewResponseDto {
  @ApiProperty()
  reviewId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName?: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  isVerifiedPurchase: boolean;

  @ApiProperty()
  isApproved: boolean;

  @ApiProperty({ required: false })
  adminResponse?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProductRatingSummaryDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}


