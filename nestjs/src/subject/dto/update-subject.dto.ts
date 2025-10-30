import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubjectDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxTopics?: number;

  @IsOptional() @IsUrl()
  image?: string; // sẽ bị override nếu có file upload
}
