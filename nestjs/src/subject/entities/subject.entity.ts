// src/subject/entities/subject.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: false })
export class Subject {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: 20 })
  maxTopics?: number;

  @Prop({
    default:
      'https://res.cloudinary.com/dglm2f7sr/image/upload/v1761400287/default_gdfbhs.png',
  })
  image?: string;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
