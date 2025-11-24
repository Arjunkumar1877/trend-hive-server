import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface OrderAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'OrderItem' }], default: [] })
  items: Types.ObjectId[];

  @Prop({ required: true, type: Number })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  tax: number;

  @Prop({ type: Number, default: 0 })
  shippingFee: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ required: true, type: Number })
  total: number;

  @Prop({ type: String, default: 'USD' })
  currency: string;

  @Prop({ type: String })
  paymentMethod?: string;

  @Prop({ type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: String, required: true })
  orderNumber: string;

  @Prop({ type: Object, required: true })
  shippingAddress: OrderAddress;

  @Prop({ type: Object, required: true })
  billingAddress: OrderAddress;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({ type: Date })
  refundedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);



