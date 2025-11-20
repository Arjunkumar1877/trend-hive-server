import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from '../data/schemas/order.schema';
import { OrderItem, OrderItemDocument } from '../data/schemas/order-item.schema';
import { Product, ProductDocument } from '../data/schemas/product.schema';
import { Image, ImageDocument } from '../data/schemas/image.schema';
import { User, UserDocument } from '../data/schemas/user.schema';
import {
  CreateOrderDto,
  OrderItemInputDto,
  OrderResponseDto,
  OrderItemResponseDto,
} from './order.dto';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name)
    private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Image.name)
    private imageModel: Model<ImageDocument>,
    private readonly cartService: CartService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const itemDetails = await this.prepareOrderItems(createOrderDto.items);
    const subtotal = itemDetails.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = createOrderDto.shippingFee ?? 0;
    const tax = createOrderDto.tax ?? 0;
    const discount = createOrderDto.discount ?? 0;
    const total = subtotal + shippingFee + tax - discount;

    if (total < 0) {
      throw new BadRequestException('Order total cannot be negative');
    }

    const order = new this.orderModel({
      userId,
      subtotal,
      shippingFee,
      tax,
      discount,
      total,
      currency: createOrderDto.currency ?? 'USD',
      paymentMethod: createOrderDto.paymentMethod,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      orderNumber: await this.generateOrderNumber(),
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress ?? createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
    });

    await order.save();

    const orderItems = await this.orderItemModel.insertMany(
      itemDetails.map((item) => ({
        orderId: order._id,
        product: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        productImage: item.productImage,
      })),
    );

    order.items = orderItems.map((item) => item._id);
    await order.save();

    if (createOrderDto.clearCart) {
      await this.cartService.clearCart(userId);
    }

    const populatedOrder = await this.getOrderById(order._id.toString());
    if (!populatedOrder) {
      throw new NotFoundException('Unable to retrieve created order');
    }
    return populatedOrder;
  }

  async getOrderById(orderId: string): Promise<OrderResponseDto | null> {
    const order = await this.orderModel
      .findById(orderId)
      .populate({
        path: 'items',
        populate: { path: 'product' },
      })
      .exec();
    if (!order) {
      return null;
    }
    return this.mapOrderToResponse(order);
  }

  async getOrderForUser(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.orderModel
      .findOne({ _id: new Types.ObjectId(orderId), userId: new Types.ObjectId(userId) })
      .populate({
        path: 'items',
        populate: { path: 'product' },
      })
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.mapOrderToResponse(order);
  }

  async getOrdersForUser(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'items',
        populate: { path: 'product' },
      })
      .exec();
    return orders.map((order) => this.mapOrderToResponse(order));
  }

  async getAllOrders(): Promise<OrderResponseDto[]> {
    const orders = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'items',
        populate: { path: 'product' },
      })
      .exec();
    return orders.map((order) => this.mapOrderToResponse(order));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException(`Cannot update status for ${order.status} order`);
    }

    order.status = status;
    if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    await order.save();
    const populatedOrder = await this.getOrderById(orderId);
    if (!populatedOrder) {
      throw new NotFoundException('Unable to retrieve updated order');
    }
    return populatedOrder;
  }

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.paymentStatus = paymentStatus;
    if (paymentStatus === PaymentStatus.REFUNDED) {
      order.refundedAt = new Date();
    }

    await order.save();
    const populatedOrder = await this.getOrderById(orderId);
    if (!populatedOrder) {
      throw new NotFoundException('Unable to retrieve updated order');
    }
    return populatedOrder;
  }

  async cancelOrder(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (![OrderStatus.PENDING, OrderStatus.PROCESSING].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    await order.save();

    const populatedOrder = await this.getOrderById(orderId);
    if (!populatedOrder) {
      throw new NotFoundException('Unable to retrieve cancelled order');
    }
    return populatedOrder;
  }

  async refundOrder(orderId: string): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    order.status = OrderStatus.REFUNDED;
    order.paymentStatus = PaymentStatus.REFUNDED;
    order.refundedAt = new Date();
    await order.save();

    const populatedOrder = await this.getOrderById(orderId);
    if (!populatedOrder) {
      throw new NotFoundException('Unable to retrieve refunded order');
    }
    return populatedOrder;
  }

  private async prepareOrderItems(items: OrderItemInputDto[]): Promise<
    Array<{
      productId: Types.ObjectId;
      productName: string;
      productPrice: number;
      quantity: number;
      subtotal: number;
      productImage?: string;
    }>
  > {
    const preparedItems: Array<{
      productId: Types.ObjectId;
      productName: string;
      productPrice: number;
      quantity: number;
      subtotal: number;
      productImage?: string;
    }> = [];

    for (const item of items) {
      const product = await this.productModel.findById(item.productId).exec();
      if (!product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }

      if (product.availableQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      const images = await this.imageModel.find({ product: product._id }).exec();
      const coverImage = images.find((img) => img.isCover) || images[0];

      preparedItems.push({
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
        productImage: coverImage?.image,
      });
    }

    return preparedItems;
  }

  private mapOrderToResponse(order: OrderDocument): OrderResponseDto {
    const items = (order.items as unknown as OrderItemDocument[]).map((item) => this.mapOrderItem(item));
    return {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingFee: order.shippingFee,
      discount: order.discount,
      total: order.total,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      items,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      refundedAt: order.refundedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private mapOrderItem(orderItem: OrderItemDocument): OrderItemResponseDto {
    return {
      orderItemId: orderItem._id.toString(),
      productId: orderItem.product.toString(),
      productName: orderItem.productName,
      productPrice: orderItem.productPrice,
      quantity: orderItem.quantity,
      subtotal: orderItem.subtotal,
      productImage: orderItem.productImage,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `TH-${datePart}-${randomPart}`;
  }
}

