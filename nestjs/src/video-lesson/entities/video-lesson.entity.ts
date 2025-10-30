import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Topic } from 'src/topic/entities/topic.entity';

export type VideoLessonDocument = VideoLesson & Document;

@Schema({ timestamps: false })
export class VideoLesson {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: Number, min: 0 })
  duration?: number; // seconds

  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topic: Types.ObjectId | Topic;
}

export const VideoLessonSchema = SchemaFactory.createForClass(VideoLesson);
