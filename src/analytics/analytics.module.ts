import { Module } from '@nestjs/common';
// Analytics Module
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../data/schemas/order.schema';
import { OrderItem, OrderItemSchema } from '../data/schemas/order-item.schema';
import { Product, ProductSchema } from '../data/schemas/product.schema';
import { User, UserSchema } from '../data/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule, // For AdminGuard (User retrieval)
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
