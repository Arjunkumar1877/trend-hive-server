import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../data/schemas/review.schema';
import { Product, ProductDocument } from '../data/schemas/product.schema';
import { User, UserDocument } from '../data/schemas/user.schema';
import { Order, OrderDocument } from '../data/schemas/order.schema';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  ProductRatingSummaryDto,
} from './review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  /**
   * Create a new review
   */
  async createReview(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const product = await this.productModel.findById(createReviewDto.productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewModel
      .findOne({ product: product._id, user: user._id })
      .exec();

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Check if this is a verified purchase
    const hasOrdered = await this.checkVerifiedPurchase(userId, createReviewDto.productId);

    const review = new this.reviewModel({
      product: product._id,
      user: user._id,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      isVerifiedPurchase: hasOrdered,
      isApproved: false, // Reviews need admin approval
    });

    await review.save();
    return this.mapReviewToResponse(review, user, product);
  }

  /**
   * Get all reviews for a product
   */
  async getProductReviews(
    productId: string,
    includeUnapproved = false,
  ): Promise<ReviewResponseDto[]> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const query: any = { product: product._id };
    if (!includeUnapproved) {
      query.isApproved = true;
    }

    const reviews = await this.reviewModel
      .find(query)
      .populate('user')
      .sort({ createdAt: -1 })
      .exec();

    return reviews.map((review) =>
      this.mapReviewToResponse(review, review.user as any, product),
    );
  }

  /**
   * Get a single review
   */
  async getReview(reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.reviewModel
      .findById(reviewId)
      .populate('user')
      .populate('product')
      .exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.mapReviewToResponse(
      review,
      review.user as any,
      review.product as any,
    );
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(userId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewModel
      .find({ user: userId })
      .populate('product')
      .sort({ createdAt: -1 })
      .exec();

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return reviews.map((review) =>
      this.mapReviewToResponse(review, user, review.product as any),
    );
  }

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewModel
      .findById(reviewId)
      .populate('user')
      .populate('product')
      .exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user._id.toString() !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    if (updateReviewDto.rating) {
      review.rating = updateReviewDto.rating;
    }

    if (updateReviewDto.comment) {
      review.comment = updateReviewDto.comment;
    }

    // Reset approval status when review is edited
    review.isApproved = false;

    await review.save();
    return this.mapReviewToResponse(
      review,
      review.user as any,
      review.product as any,
    );
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewModel.findById(reviewId).exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await review.deleteOne();
  }

  /**
   * Approve/reject a review (admin)
   */
  async approveReview(reviewId: string, isApproved: boolean): Promise<ReviewResponseDto> {
    const review = await this.reviewModel
      .findById(reviewId)
      .populate('user')
      .populate('product')
      .exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isApproved = isApproved;
    await review.save();

    return this.mapReviewToResponse(
      review,
      review.user as any,
      review.product as any,
    );
  }

  /**
   * Add admin response to a review
   */
  async addAdminResponse(reviewId: string, adminResponse: string): Promise<ReviewResponseDto> {
    const review = await this.reviewModel
      .findById(reviewId)
      .populate('user')
      .populate('product')
      .exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.adminResponse = adminResponse;
    await review.save();

    return this.mapReviewToResponse(
      review,
      review.user as any,
      review.product as any,
    );
  }

  /**
   * Get product rating summary
   */
  async getProductRatingSummary(productId: string): Promise<ProductRatingSummaryDto> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const reviews = await this.reviewModel
      .find({ product: product._id, isApproved: true })
      .exec();

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        productId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = Math.round((sum / totalReviews) * 10) / 10; // Round to 1 decimal

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      productId,
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  }

  /**
   * Get all pending reviews (admin)
   */
  async getPendingReviews(): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewModel
      .find({ isApproved: false })
      .populate('user')
      .populate('product')
      .sort({ createdAt: -1 })
      .exec();

    return reviews.map((review) =>
      this.mapReviewToResponse(
        review,
        review.user as any,
        review.product as any,
      ),
    );
  }

  /**
   * Check if user has purchased the product (verified purchase)
   */
  private async checkVerifiedPurchase(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const orders = await this.orderModel
      .find({ userId })
      .populate('items')
      .exec();

    for (const order of orders) {
      const orderItems = order.items as any[];
      const hasPurchased = orderItems.some(
        (item) => item.product.toString() === productId,
      );
      if (hasPurchased) {
        return true;
      }
    }

    return false;
  }

  /**
   * Map review to response DTO
   */
  private mapReviewToResponse(
    review: ReviewDocument,
    user: UserDocument,
    product: ProductDocument,
  ): ReviewResponseDto {
    return {
      reviewId: review._id.toString(),
      productId: product._id.toString(),
      productName: product.name,
      userId: user._id.toString(),
      userName: user.name,
      rating: review.rating,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isApproved: review.isApproved,
      adminResponse: review.adminResponse,
      createdAt: review.createdAt!,
      updatedAt: review.updatedAt!,
    };
  }
}

