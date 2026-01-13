import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../data/schemas/order.schema';
import { OrderItem, OrderItemDocument } from '../data/schemas/order-item.schema';
import { Product, ProductDocument } from '../data/schemas/product.schema';
import { User, UserDocument } from '../data/schemas/user.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboardStats() {
    const totalOrders = await this.orderModel.countDocuments();
    const totalUsers = await this.userModel.countDocuments();
    const totalProducts = await this.productModel.countDocuments();

    const revenueAggregation = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: OrderStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
        },
      },
    ]);

    const totalRevenue =
      revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    return {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
    };
  }

  async getSalesAnalytics(startDate?: string, endDate?: string) {
    const matchStage: any = {
      status: { $ne: OrderStatus.CANCELLED },
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const salesData = await this.orderModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return salesData.map((item) => ({
      date: item._id,
      totalSales: item.totalSales,
      orderCount: item.orderCount,
    }));
  }

  async getTopProducts(limit: number = 5) {
    const topProducts = await this.orderItemModel.aggregate([
      {
        $group: {
          _id: '$product', // Group by product ID
          productName: { $first: '$productName' },
          totalSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$subtotal' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: Number(limit) },
    ]);

    return topProducts;
  }
}
