import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  ProductRatingSummaryDto,
  AdminReviewResponseDto,
  ApproveReviewDto,
} from './review.dto';
import { FirebaseAuthGuard } from '../gaurds/firebase-auth-guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully', type: ReviewResponseDto })
  createReview(
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(req.user.userId, createReviewDto);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all approved reviews for a product' })
  @ApiResponse({ status: 200, description: 'Returns product reviews', type: [ReviewResponseDto] })
  getProductReviews(@Param('productId') productId: string): Promise<ReviewResponseDto[]> {
    return this.reviewsService.getProductReviews(productId, false);
  }

  @Get('product/:productId/summary')
  @ApiOperation({ summary: 'Get product rating summary' })
  @ApiResponse({
    status: 200,
    description: 'Returns product rating summary',
    type: ProductRatingSummaryDto,
  })
  getProductRatingSummary(@Param('productId') productId: string): Promise<ProductRatingSummaryDto> {
    return this.reviewsService.getProductRatingSummary(productId);
  }

  @Get('user/my-reviews')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get reviews by authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns user reviews', type: [ReviewResponseDto] })
  getUserReviews(@Request() req): Promise<ReviewResponseDto[]> {
    return this.reviewsService.getUserReviews(req.user.userId);
  }

  @Get('pending')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all pending reviews (admin)' })
  @ApiResponse({ status: 200, description: 'Returns pending reviews', type: [ReviewResponseDto] })
  getPendingReviews(): Promise<ReviewResponseDto[]> {
    return this.reviewsService.getPendingReviews();
  }

  @Get(':reviewId')
  @ApiOperation({ summary: 'Get a single review' })
  @ApiResponse({ status: 200, description: 'Returns review', type: ReviewResponseDto })
  getReview(@Param('reviewId') reviewId: string): Promise<ReviewResponseDto> {
    return this.reviewsService.getReview(reviewId);
  }

  @Patch(':reviewId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully', type: ReviewResponseDto })
  updateReview(
    @Request() req,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.updateReview(reviewId, req.user.userId, updateReviewDto);
  }

  @Delete(':reviewId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async deleteReview(@Request() req, @Param('reviewId') reviewId: string): Promise<{ message: string }> {
    await this.reviewsService.deleteReview(reviewId, req.user.userId);
    return { message: 'Review deleted successfully' };
  }

  @Patch(':reviewId/approve')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve or reject a review (admin)' })
  @ApiResponse({ status: 200, description: 'Review approval status updated', type: ReviewResponseDto })
  approveReview(
    @Param('reviewId') reviewId: string,
    @Body() approveReviewDto: ApproveReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.approveReview(reviewId, approveReviewDto.isApproved);
  }

  @Patch(':reviewId/admin-response')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add admin response to a review (admin)' })
  @ApiResponse({ status: 200, description: 'Admin response added', type: ReviewResponseDto })
  addAdminResponse(
    @Param('reviewId') reviewId: string,
    @Body() adminResponseDto: AdminReviewResponseDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.addAdminResponse(reviewId, adminResponseDto.adminResponse);
  }
}

