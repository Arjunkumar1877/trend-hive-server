import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, maxlength: 255 })
  name: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  firebaseId: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ default: false })
  isEmailVerified?: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Address' }] })
  addresses?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

