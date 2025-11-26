import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  comment: string;

  @Prop({ default: false })
  isVerifiedPurchase: boolean;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ type: String })
  adminResponse?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Create compound index to ensure user can only review a product once
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

