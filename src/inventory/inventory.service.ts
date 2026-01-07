import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../data/schemas/product.schema';

export interface InventoryItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
}

@Injectable()
export class InventoryService {
  private readonly LOW_STOCK_THRESHOLD = 10;

  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  /**
   * Validate if sufficient stock is available for all items
   */
  async validateStock(items: InventoryItem[]): Promise<void> {
    for (const item of items) {
      const product = await this.productModel.findById(item.productId).exec();

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (product.availableQuantity < item.quantity) {
        // If variantId is present, we should check variant stock
        if (item.variantId) {
             const variant = product.variants.find((v: any) => v._id.toString() === item.variantId);
             if (!variant) {
                 throw new NotFoundException(`Variant ${item.variantId} not found for product ${product.name}`);
             }
             if (variant.stock < item.quantity) {
                 throw new BadRequestException(
                    `Insufficient stock for product "${product.name}" variant. Available: ${variant.stock}, Requested: ${item.quantity}`
                 );
             }
             // Valid stock
        } else {
           throw new BadRequestException(
            `Insufficient stock for product "${product.name}". Available: ${product.availableQuantity}, Requested: ${item.quantity}`,
          );
        }
      }
    }
  }

  /**
   * Reserve stock for order (deduct from available quantity)
   */
  async reserveStock(items: InventoryItem[]): Promise<void> {
    // First validate all items have sufficient stock
    await this.validateStock(items);

    // Then deduct stock for each item
    // Then deduct stock for each item
    for (const item of items) {
      if (item.variantId) {
        // Update variant stock
        await this.productModel.updateOne(
          { _id: item.productId, 'variants.sku': { $exists: true } }, // Verify variants exist
             // Actually, variantId is the subdoc ID.
             // We need to update nested array element.
             // 'variants._id': item.variantId
          { 
             $inc: { 'variants.$[elem].stock': -item.quantity } 
             // We also want to update total availableQuantity? 
             // Ideally yes, but ProductsService logic maintained it as sum.
             // If we decrement variant, we should also decrement main.
             // But it's easier if availableQuantity is ALWAYS computed or we sync it.
             // Simple approach: decrement both.
          },
          { 
            arrayFilters: [{ 'elem._id': item.variantId }]
            // We also need to decrement main availableQuantity
          }
        ).exec();
        
        // Decrement main quantity as well to keep in sync
        await this.productModel
        .findByIdAndUpdate(
          item.productId,
          { $inc: { availableQuantity: -item.quantity } },
          { new: true },
        )
        .exec();

      } else {
        await this.productModel
          .findByIdAndUpdate(
            item.productId,
            { $inc: { availableQuantity: -item.quantity } },
            { new: true },
          )
          .exec();
      }
    }
  }

  /**
   * Restore stock when order is cancelled or refunded
   */
  async restoreStock(items: InventoryItem[]): Promise<void> {
    for (const item of items) {
      const product = await this.productModel.findById(item.productId).exec();

      if (!product) {
        // Log warning but don't fail - product might have been deleted
        console.warn(`Product ${item.productId} not found during stock restoration`);
        continue;
      }

      if (item.variantId) {
          // Restore variant stock
         await this.productModel.updateOne(
          { _id: item.productId },
          { $inc: { 'variants.$[elem].stock': item.quantity } },
          { arrayFilters: [{ 'elem._id': item.variantId }] }
        ).exec();
      }
      
      // Always restore main quantity
      await this.productModel
        .findByIdAndUpdate(
          item.productId,
          { $inc: { availableQuantity: item.quantity } },
          { new: true },
        )
        .exec();
    }
  }

  /**
   * Check if a single product has sufficient stock
   */
  async checkProductStock(productId: string, quantity: number): Promise<boolean> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    return product.availableQuantity >= quantity;
  }

  /**
   * Get current stock for a product
   */
  async getProductStock(productId: string): Promise<number> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    return product.availableQuantity;
  }

  /**
   * Get all products with low stock (below threshold)
   */
  async getLowStockProducts(threshold?: number): Promise<LowStockProduct[]> {
    const stockThreshold = threshold ?? this.LOW_STOCK_THRESHOLD;

    const products = await this.productModel
      .find({ availableQuantity: { $lte: stockThreshold, $gt: 0 } })
      .exec();

    return products.map((product) => ({
      productId: product._id.toString(),
      productName: product.name,
      currentStock: product.availableQuantity,
      threshold: stockThreshold,
    }));
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(): Promise<LowStockProduct[]> {
    const products = await this.productModel
      .find({ availableQuantity: 0 })
      .exec();

    return products.map((product) => ({
      productId: product._id.toString(),
      productName: product.name,
      currentStock: 0,
      threshold: this.LOW_STOCK_THRESHOLD,
    }));
  }

  /**
   * Manually adjust stock (for admin use)
   */
  async adjustStock(
    productId: string,
    adjustment: number,
    reason?: string,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const newQuantity = product.availableQuantity + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `Stock adjustment would result in negative inventory. Current: ${product.availableQuantity}, Adjustment: ${adjustment}`,
      );
    }

    product.availableQuantity = newQuantity;
    await product.save();

    // Log the adjustment (in a real app, you'd store this in an audit log)
    console.log(
      `Stock adjusted for product ${product.name} (${productId}): ${adjustment > 0 ? '+' : ''}${adjustment}. New stock: ${newQuantity}. Reason: ${reason || 'N/A'}`,
    );

    return product;
  }

  /**
   * Set stock to a specific value (for admin use)
   */
  async setStock(productId: string, quantity: number): Promise<ProductDocument> {
    if (quantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const oldQuantity = product.availableQuantity;
    product.availableQuantity = quantity;
    await product.save();

    console.log(
      `Stock set for product ${product.name} (${productId}): ${oldQuantity} → ${quantity}`,
    );

    return product;
  }

  /**
   * Check if stock is low for a product
   */
  isLowStock(availableQuantity: number, threshold?: number): boolean {
    const stockThreshold = threshold ?? this.LOW_STOCK_THRESHOLD;
    return availableQuantity > 0 && availableQuantity <= stockThreshold;
  }

  /**
   * Check if product is out of stock
   */
  isOutOfStock(availableQuantity: number): boolean {
    return availableQuantity === 0;
  }
}


