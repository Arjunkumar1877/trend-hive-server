import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class Variant {
  _id: Types.ObjectId;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true, type: Number })
  stock: number;

  @Prop({ type: Number, default: 0 })
  priceModifier: number;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);

@Schema({ timestamps: true })
export class Product {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ required: true, type: Number })
  availableQuantity: number;

  @Prop({ type: [{ type: VariantSchema }], default: [] })
  variants: Variant[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Image' }] })
  images?: Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

