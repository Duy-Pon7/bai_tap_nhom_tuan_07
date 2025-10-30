import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoLesson, VideoLessonSchema } from './entities/video-lesson.entity';
import { VideoLessonService } from './video-lesson.service';
import { VideoLessonController } from './video-lesson.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VideoLesson.name, schema: VideoLessonSchema },
    ]),
  ],
  controllers: [VideoLessonController],
  providers: [VideoLessonService],
  exports: [VideoLessonService], // nếu module khác cần dùng service này
})
export class VideoLessonModule {}
