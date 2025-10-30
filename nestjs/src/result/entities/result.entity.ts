import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Quiz } from 'src/quiz/entities/quiz.entity';

export type ResultDocument = Result & Document;

@Schema({ timestamps: false })
export class Result {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Quiz.name, required: true })
  quiz: Types.ObjectId | Quiz;

  @Prop({ type: Number, required: true })
  bestScore: number;

  @Prop({ type: Number, required: true, default: 0 })
  attempts: number;

  @Prop({ type: Number, required: true, default: 0 })
  averageScore: number;

  @Prop({ type: Date, default: null })
  lastSubmissionAt?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const ResultSchema = SchemaFactory.createForClass(Result);
