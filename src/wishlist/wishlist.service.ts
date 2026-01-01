import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, WishlistDocument } from '../data/schemas/wishlist.schema';
import { Product, ProductDocument } from '../data/schemas/product.schema';
import { User, UserDocument } from '../data/schemas/user.schema';
import { Image, ImageDocument } from '../data/schemas/image.schema';
import { AddToWishlistDto, WishlistResponseDto, WishlistItemDto } from './wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name)
    private wishlistModel: Model<WishlistDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Image.name)
    private imageModel: Model<ImageDocument>,
  ) {}

  /**
   * Get or create wishlist for a user
   */
  async getOrCreateWishlist(userId: string): Promise<WishlistDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let wishlist = await this.wishlistModel.findOne({ userId }).exec();

    if (!wishlist) {
      wishlist = new this.wishlistModel({
        userId,
        products: [],
      });
      await wishlist.save();
    }

    return wishlist;
  }

  /**
   * Get wishlist with populated product details
   */
  async getWishlist(userId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const populatedItems: WishlistItemDto[] = [];

    for (const productId of wishlist.products) {
      const product = await this.productModel
        .findById(productId)
        .populate('category')
        .exec();

      if (!product) {
        // Skip invalid products
        continue;
      }

      // Get product images
      const images = await this.imageModel
        .find({ product: product._id })
        .exec();
      const coverImage = images.find((img) => img.isCover) || images[0];

      populatedItems.push({
        productId: product._id.toString(),
        productName: product.name,
        productPrice: product.price,
        productDescription: product.description,
        productImage: coverImage?.image,
        availableQuantity: product.availableQuantity,
        addedAt: wishlist.updatedAt || wishlist.createdAt || new Date(),
      });
    }

    return {
      wishlistId: wishlist._id.toString(),
      userId: wishlist.userId.toString(),
      items: populatedItems,
      totalItems: populatedItems.length,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(
    userId: string,
    addToWishlistDto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    const product = await this.productModel.findById(addToWishlistDto.productId).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const wishlist = await this.getOrCreateWishlist(userId);

    // Check if product already in wishlist
    const productObjectId = product._id;
    const isAlreadyInWishlist = wishlist.products.some(
      (p) => p.toString() === productObjectId.toString(),
    );

    if (isAlreadyInWishlist) {
      throw new ConflictException('Product is already in your wishlist');
    }

    wishlist.products.push(productObjectId);
    await wishlist.save();

    return this.getWishlist(userId);
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(userId: string, productId: string): Promise<WishlistResponseDto> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const productIndex = wishlist.products.findIndex(
      (p) => p.toString() === productId,
    );

    if (productIndex === -1) {
      throw new NotFoundException('Product not found in wishlist');
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    return this.getWishlist(userId);
  }

  /**
   * Clear entire wishlist
   */
  async clearWishlist(userId: string): Promise<void> {
    const wishlist = await this.getOrCreateWishlist(userId);
    wishlist.products = [];
    await wishlist.save();
  }

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlist = await this.getOrCreateWishlist(userId);
    return wishlist.products.some((p) => p.toString() === productId);
  }

  /**
   * Get wishlist item count
   */
  async getWishlistItemCount(userId: string): Promise<number> {
    const wishlist = await this.getOrCreateWishlist(userId);
    return wishlist.products.length;
  }

  /**
   * Move wishlist items to cart (add all wishlist products to cart)
   */
  async moveToCart(userId: string, productIds?: string[]): Promise<{ message: string; movedCount: number }> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const productsToMove = productIds
      ? wishlist.products.filter((p) => productIds.includes(p.toString()))
      : wishlist.products;

    if (productsToMove.length === 0) {
      throw new BadRequestException('No products to move to cart');
    }

    // Remove moved products from wishlist
    wishlist.products = wishlist.products.filter(
      (p) => !productsToMove.some((pid) => pid.toString() === p.toString()),
    );
    await wishlist.save();

    return {
      message: 'Products moved to cart successfully',
      movedCount: productsToMove.length,
    };
  }
}

