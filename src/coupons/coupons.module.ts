import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { Coupon, CouponSchema } from '../data/schemas/coupon.schema';
import { UsersModule } from '../users/users.module'; // Required for AdminGuard via UsersService

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
    UsersModule, 
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
