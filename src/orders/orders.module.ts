import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from '../data/schemas/order.schema';
import { OrderItem, OrderItemSchema } from '../data/schemas/order-item.schema';
import { Product, ProductSchema } from '../data/schemas/product.schema';
import { User, UserSchema } from '../data/schemas/user.schema';
import { Image, ImageSchema } from '../data/schemas/image.schema';
import { CartModule } from '../cart/cart.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Image.name, schema: ImageSchema },
    ]),
    CartModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}


