import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Quiz } from 'src/quiz/entities/quiz.entity';

@Schema({ _id: false })
export class Answer {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  isCorrect: boolean;
}

@Schema({ timestamps: false })
export class Question {
  @Prop({ required: true })
  text: string;

  @Prop({ type: Types.ObjectId, ref: Quiz.name, required: true })
  quiz: Types.ObjectId | Quiz;

  // ⚡ Giữ nguyên như bản Express: Mỗi answer có _id riêng
  @Prop({ type: [SchemaFactory.createForClass(Answer)], _id: true })
  answers: Answer[];

  @Prop()
  explanation?: string;
}

export type QuestionDocument = Question & Document;
export const QuestionSchema = SchemaFactory.createForClass(Question);
