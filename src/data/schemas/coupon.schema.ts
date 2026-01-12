import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, enum: DiscountType })
  discountType: DiscountType;

  @Prop({ required: true, min: 0 })
  value: number; // Percentage (e.g., 10 for 10%) or Fixed Amount (e.g., 50)

  @Prop({ required: true })
  expirationDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  usageLimit: number | null; // Null means unlimited

  @Prop({ default: 0 })
  usageCount: number;
  
  @Prop({ default: 0 })
  minOrderValue: number; // Minimum order amount to apply coupon

  createdAt?: Date;
  updatedAt?: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
