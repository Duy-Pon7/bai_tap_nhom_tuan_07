import { IsMongoId, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  topic: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  questionCount?: number;
}
