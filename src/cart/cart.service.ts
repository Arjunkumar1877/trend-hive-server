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

      let price = product.price;
      let variantName: string | undefined = undefined;
      let productImage = coverImage?.image;

      if (item.variantId && product.variants) {
        const variant = product.variants.find(v => (v as any)._id.toString() === item.variantId);
        if (variant) {
          if (variant.priceModifier) {
            price += variant.priceModifier;
          }
          variantName = `${variant.size} / ${variant.color}`;
          // Could also look for variant specific image if we had that mapping, 
          // but for now relying on product images.
        }
      }

      populatedItems.push({
        productId: product._id.toString(),
        productName: product.name,
        productPrice: price,
        quantity: item.quantity,
        subtotal: price * item.quantity,
        productImage: productImage,
        variantId: item.variantId,
        variantName: variantName,
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

    // Check for variants
    let availableStock = product.availableQuantity;
    let variantPrice = product.price;

    if (product.variants && product.variants.length > 0) {
      if (!addToCartDto.variantId) {
        throw new BadRequestException('Product has variants. Please select a variant.');
      }

      const variant = product.variants.find(v => (v as any)._id.toString() === addToCartDto.variantId);
      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      availableStock = variant.stock;
      if (variant.priceModifier) {
        variantPrice += variant.priceModifier;
      }
    }

    // Check if product/variant is available
    if (availableStock < addToCartDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${availableStock} items available.`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if product already exists in cart with same variant
    const existingItemIndex = cart.items.findIndex(
      (item) => 
        item.product.toString() === addToCartDto.productId && 
        item.variantId === addToCartDto.variantId
    );

    if (existingItemIndex !== -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + addToCartDto.quantity;

      // Check stock availability
      if (availableStock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Only ${availableStock} items available.`,
        );
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: product._id,
        quantity: addToCartDto.quantity,
        variantId: addToCartDto.variantId,
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

    // Check for variants stock
    let availableStock = product.availableQuantity;
    if (updateCartItemDto.variantId && product.variants) {
       const variant = product.variants.find(v => (v as any)._id.toString() === updateCartItemDto.variantId);
       if (variant) {
         availableStock = variant.stock;
       }
    }

    // Check stock availability
    if (availableStock < updateCartItemDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${availableStock} items available.`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex(
      (item) => 
        item.product.toString() === updateCartItemDto.productId &&
        item.variantId === updateCartItemDto.variantId
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
  async removeFromCart(userId: string, productId: string, variantId?: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);

    const itemIndex = cart.items.findIndex(
      (item) => 
        item.product.toString() === productId &&
        item.variantId === variantId
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

