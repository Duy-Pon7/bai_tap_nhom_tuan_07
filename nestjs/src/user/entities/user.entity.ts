import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, required: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop({ default: 'New User' }) fullname: string;
  @Prop() otp?: string;
  @Prop() otpExpires?: Date;
  @Prop({ default: false }) isVerified: boolean;
  @Prop({
    default:
      'https://res.cloudinary.com/dglm2f7sr/image/upload/v1761373988/default_awmzq0.jpg',
  })
  avatar: string;
  @Prop({ enum: ['USER', 'ADMIN'], default: 'USER', required: true })
  role: 'USER' | 'ADMIN';
  @Prop({ default: () => new Date('2000-01-01') }) dob: Date;
  @Prop({ enum: [0, 1], default: 1 }) sex: 0 | 1;
}

export const UserSchema = SchemaFactory.createForClass(User);
