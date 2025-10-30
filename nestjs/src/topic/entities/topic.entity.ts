import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Subject } from 'src/subject/entities/subject.entity';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: false })
export class Topic {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true })
  subject: Types.ObjectId | Subject;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
