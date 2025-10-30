import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Quiz } from 'src/quiz/entities/quiz.entity';
import { Question } from 'src/question/entities/question.entity';

export type SubmissionDocument = Submission & Document;

@Schema({ _id: false })
export class SubmissionAnswer {
  @Prop({ type: Types.ObjectId, ref: Question.name, required: true })
  question: Types.ObjectId | Question;

  @Prop({ type: String, required: true })
  selectedAnswer: string;

  @Prop({ type: Boolean, required: true })
  isCorrect: boolean;
}

@Schema({ timestamps: false })
export class Submission {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Quiz.name, required: true })
  quiz: Types.ObjectId | Quiz;

  @Prop({ type: [SchemaFactory.createForClass(SubmissionAnswer)], required: true })
  answers: SubmissionAnswer[];

  @Prop({ type: Number, required: true })
  score: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
