import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ timestamps: true })
export class Address {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 255 })
  address: string;

  @Prop({ required: true, maxlength: 100 })
  city: string;

  @Prop({ required: true, maxlength: 100 })
  state: string;

  @Prop({ required: true, maxlength: 20 })
  zipCode: string;

  @Prop({ required: true, maxlength: 20 })
  country: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ default: false })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

