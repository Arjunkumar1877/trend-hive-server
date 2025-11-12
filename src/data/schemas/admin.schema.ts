import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true, collection: 'admin' })
export class Admin {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

