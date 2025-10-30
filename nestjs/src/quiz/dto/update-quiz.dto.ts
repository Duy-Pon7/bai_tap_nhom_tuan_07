import { PartialType } from '@nestjs/mapped-types';
import { CreateQuizDto } from './create-quiz.dto';
import { IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  uniqueUserCount?: number;

  @IsOptional()
  @IsDateString()
  lastAttemptAt?: string; // dùng string ISO, service sẽ convert sang Date

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  favoriteCount?: number;
}
