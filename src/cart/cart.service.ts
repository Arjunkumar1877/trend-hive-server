import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from '../data/schemas/cart.schema';
import { Product, ProductDocument } from '../data/schemas/product.schema';
import { User, UserDocument } from '../data/schemas/user.schema';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto, CartItemResponseDto } from './cart.dto';
import { Image, ImageDocument } from '../data/schemas/image.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Image.name)
    private imageModel: Model<ImageDocument>,
  ) {}

  /**
   * Get or create cart for a user
   */
  async getOrCreateCart(userId: string): Promise<CartDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let cart = await this.cartModel.findOne({ userId }).exec();

    if (!cart) {
      cart = new this.cartModel({
        userId,
        items: [],
      });
      await cart.save();
    }

    return cart;
  }

  /**
   * Get cart with populated product details
   */
  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    // Populate products and get their details
    const populatedItems: CartItemResponseDto[] = [];

    for (const item of cart.items) {
      const product = await this.productModel
        .findById(item.product)
        .populate('category')
        .exec();

      if (!product) {
        // Skip items with invalid products
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
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
        productImage: coverImage?.image,
      });
    }

    const subtotal = populatedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const totalItems = populatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      cartId: cart._id.toString(),
      items: populatedItems,
      totalItems,
      subtotal,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartResponseDto> {
    const product = await this.productModel.findById(addToCartDto.productId).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is available
    if (product.availableQuantity < addToCartDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${product.availableQuantity} items available.`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === addToCartDto.productId,
    );

    if (existingItemIndex !== -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + addToCartDto.quantity;

      // Check stock availability
      if (product.availableQuantity < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Only ${product.availableQuantity} items available.`,
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: product._id,
        quantity: addToCartDto.quantity,
      });
    }

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const product = await this.productModel.findById(updateCartItemDto.productId).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check stock availability
    if (product.availableQuantity < updateCartItemDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${product.availableQuantity} items available.`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === updateCartItemDto.productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.items[itemIndex].quantity = updateCartItemDto.quantity;
    await cart.save();

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return this.getCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    await cart.save();
  }

  /**
   * Get cart item count (for header badge)
   */
  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.getOrCreateCart(userId);
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

