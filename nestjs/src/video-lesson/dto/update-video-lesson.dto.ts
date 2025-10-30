import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoLessonDto } from './create-video-lesson.dto';
import { IsMongoId, IsOptional } from 'class-validator';

export class UpdateVideoLessonDto extends PartialType(CreateVideoLessonDto) {
  @IsOptional()
  @IsMongoId()
  topic?: string; 
}
