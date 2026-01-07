import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderItemDocument = OrderItem & Document;

@Schema({ timestamps: true })
export class OrderItem {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, type: Number })
  productPrice: number;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  subtotal: number;

  @Prop({ required: false })
  productImage?: string;

  @Prop({ type: String })
  variantId?: string;

  @Prop({ type: String })
  variantName?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

