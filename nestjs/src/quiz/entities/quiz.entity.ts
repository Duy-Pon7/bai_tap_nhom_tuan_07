import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Topic } from 'src/topic/entities/topic.entity';

export type QuizDocument = Quiz & Document;

@Schema({ timestamps: true })
export class Quiz {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topic: Types.ObjectId | Topic;

  @Prop({ type: Number, default: 0, index: true })
  uniqueUserCount: number;

  // 👇 Quan trọng: chỉ định type: Date và không dùng union
  @Prop({ type: Date, default: null, index: true })
  lastAttemptAt?: Date;

  @Prop({ type: Number, default: 0, index: true })
  favoriteCount: number;

  @Prop({ type: Number, required: true, min: 1 })
  duration: number;

  @Prop({ type: Number, default: 0, min: 0 })
  questionCount: number;
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
