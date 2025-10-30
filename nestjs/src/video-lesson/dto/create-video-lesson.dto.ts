import { IsMongoId, IsNotEmpty, IsOptional, IsPositive, IsString, IsUrl, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVideoLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  duration?: number;

  @IsMongoId()
  topic: string; // client gửi string, service sẽ convert sang ObjectId
}
