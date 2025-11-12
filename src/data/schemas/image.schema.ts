import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImageDocument = Image & Document;

@Schema({ timestamps: true })
export class Image {
  _id: Types.ObjectId;

  @Prop({ required: true })
  image: string;

  @Prop({ default: false })
  isCover: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ImageSchema = SchemaFactory.createForClass(Image);

